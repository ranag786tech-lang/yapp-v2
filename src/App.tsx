import { useState, useEffect } from 'react';
import { MessageSquare, Phone, Radio, Settings as SettingsIcon } from 'lucide-react';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { CallModal } from './components/CallModal';
import { GroupModal } from './components/GroupModal';
import { ChatInfoModal } from './components/ChatInfoModal';
import { PrivacyModal } from './components/PrivacyModal';
import { CallsHistoryView } from './components/CallsHistoryView';
import { StatusView } from './components/StatusView';
import { PrivacySettingsView } from './components/PrivacySettingsView';
import { SplashScreen } from './components/onboarding/SplashScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NewChatModal } from './components/NewChatModal';
import { 
  CURRENT_USER as DEFAULT_USER, 
  DEFAULT_PRIVACY_SETTINGS 
} from './data/mockData';
import { Chat, Message, User, CallLog, StatusStory, PrivacySettings } from './types';
import { observeAuthState, signOutUser } from './lib/firebase';
import { purgeMockStorage } from './lib/cleanSlate';
import { 
  subscribeToRegisteredUsers, 
  saveUserToFirestore, 
  subscribeToUserChats, 
  subscribeToChatMessages, 
  sendMessageToFirestore, 
  getOrCreateDirectChat,
  getUserProfileFromFirestore,
  getUserPermissions,
  recordCurrentDeviceSession
} from './lib/firestoreService';

export default function App() {
  // Authentication-First Entry Guard: User starts completely unauthenticated
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [appStage, setAppStage] = useState<'splash' | 'onboarding' | 'dashboard'>('onboarding');
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');

  // Real-time Firestore users & chats state (Starts 100% clean - zero fake data)
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Calls & Status Stories State
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [stories, setStories] = useState<StatusStory[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);

  // Modals state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    isActive: boolean;
    type: 'audio' | 'video';
    chat: Chat | null;
  }>({
    isActive: false,
    type: 'audio',
    chat: null,
  });

  // 1. Authentication-First Routing & Clean Slate Observer
  useEffect(() => {
    // Comprehensive purge of legacy testing/mock items
    purgeMockStorage();

    const unsubscribe = observeAuthState(async (fbUser) => {
      let activeUid = fbUser?.uid;
      if (!activeUid) {
        // Check for verified session in sessionStorage if Firebase SMS regional policy used fallback verification
        const storedUid = sessionStorage.getItem('yapp_auth_active_user_id');
        if (storedUid) {
          activeUid = storedUid;
        }
      }

      if (!activeUid) {
        // Unauthenticated state: route immediately strictly to Login / Phone Auth
        setCurrentUser(DEFAULT_USER);
        setAppStage('onboarding');
        setIsAuthChecking(false);
        return;
      }

      try {
        // Authenticated session with Firebase token or verified session
        const profile = await getUserProfileFromFirestore(activeUid);
        
        // Fetch persistent permissions from Firestore path users/{uid}/settings
        await getUserPermissions(activeUid);

        // Record authentic session in Firestore users/{uid}/devices
        recordCurrentDeviceSession(activeUid).catch(console.warn);

        if (profile && profile.name && profile.name.trim()) {
          setCurrentUser(profile);
          setAppStage('dashboard');
        } else {
          // Firebase authenticated via phone, profile name pending
          setCurrentUser({
            ...DEFAULT_USER,
            id: activeUid,
            phone: fbUser?.phoneNumber || '',
          });
          setAppStage('onboarding');
        }
      } catch (err) {
        console.warn('Notice synchronizing Firebase user state:', err);
        setCurrentUser({
          ...DEFAULT_USER,
          id: activeUid,
          phone: fbUser?.phoneNumber || '',
        });
        setAppStage('onboarding');
      } finally {
        setIsAuthChecking(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Real-time subscription to registered users in Firestore
  useEffect(() => {
    const currentUserId = currentUser?.id;
    const unsubscribe = subscribeToRegisteredUsers((users) => {
      // Exclude self from the contacts/registered users list
      const otherUsers = currentUserId ? users.filter((u) => u.id !== currentUserId) : users;
      setRegisteredUsers(otherUsers);
    });
    return () => {
      unsubscribe?.();
    };
  }, [currentUser?.id]);

  // 3. Real-time subscription to current user's chats in Firestore
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubscribe = subscribeToUserChats(currentUser.id, (firestoreChats) => {
      setChats(firestoreChats);
    });
    return () => {
      unsubscribe?.();
    };
  }, [currentUser?.id]);

  // 4. Real-time subscription to messages for the active chat
  useEffect(() => {
    if (!activeChatId) return;
    const unsubscribe = subscribeToChatMessages(activeChatId, (messages) => {
      setMessagesMap((prev) => ({
        ...prev,
        [activeChatId]: messages,
      }));
    });
    return () => {
      unsubscribe?.();
    };
  }, [activeChatId]);

  // Determine currently active chat object safely
  const activeChat = activeChatId ? chats.find((c) => c.id === activeChatId) || null : null;
  const activeMessages = activeChatId ? messagesMap[activeChatId] || [] : [];

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    // Mark as read locally
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSendMessage = async (
    text: string,
    mediaType?: 'image' | 'audio' | 'video' | 'file' | 'sticker' | 'gif',
    mediaUrl?: string,
    audioDuration?: string
  ) => {
    if (!activeChatId || !activeChat) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      chatId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      timestamp: timeStr,
      status: 'sent',
      mediaType,
      mediaUrl,
      audioDuration,
    };

    // Optimistically update local messages
    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    // Update local chat summary
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              lastMessage: {
                text: mediaType === 'audio' ? `🎤 Voice note (${audioDuration})` : (mediaType === 'image' ? '📷 Photo' : text),
                timestamp: timeStr,
                senderName: currentUser.name,
                status: 'sent',
              },
            }
          : c
      )
    );

    // Persist real message to Firestore
    try {
      await sendMessageToFirestore(activeChatId, newMsg);
    } catch (err) {
      console.error('Failed to send message to Firestore:', err);
    }
  };

  const handleStartCallWithChat = (chat: Chat, type: 'audio' | 'video') => {
    setActiveCall({
      isActive: true,
      type,
      chat,
    });

    const newLog: CallLog = {
      id: `call-${Date.now()}`,
      name: chat.name,
      avatar: chat.avatar,
      isGroup: chat.type === 'group',
      type,
      direction: 'outgoing',
      timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      participantsCount: chat.participants.length,
    };
    setCallLogs((prev) => [newLog, ...prev]);
  };

  const handleStartCallWithUser = async (user: User, type: 'audio' | 'video') => {
    let targetChat = chats.find((c) => c.type === 'direct' && c.participants.some((p) => p.id === user.id));
    if (!targetChat) {
      try {
        targetChat = await getOrCreateDirectChat(currentUser, user);
        setChats((prev) => [targetChat!, ...prev]);
      } catch (e) {
        targetChat = {
          id: `chat-${Date.now()}`,
          type: 'direct',
          name: user.name,
          avatar: user.avatar,
          participants: [currentUser, user],
          unreadCount: 0,
          isEncrypted: true,
          createdAt: new Date().toISOString(),
        };
        setChats((prev) => [targetChat!, ...prev]);
      }
    }
    handleStartCallWithChat(targetChat, type);
  };

  const handleEndCall = () => {
    setActiveCall({
      isActive: false,
      type: 'audio',
      chat: null,
    });
  };

  const handleSelectContactUser = async (targetUser: User) => {
    setShowNewChatModal(false);
    try {
      const chat = await getOrCreateDirectChat(currentUser, targetUser);
      setChats((prev) => {
        const exists = prev.some((c) => c.id === chat.id);
        return exists ? prev : [chat, ...prev];
      });
      setActiveChatId(chat.id);
      setActiveTab('chats');
    } catch (err) {
      console.error('Error starting direct chat:', err);
      // Fallback local chat
      const localChat: Chat = {
        id: `chat_${currentUser.id}_${targetUser.id}`,
        type: 'direct',
        name: targetUser.name,
        avatar: targetUser.avatar,
        participants: [currentUser, targetUser],
        unreadCount: 0,
        isEncrypted: true,
        createdAt: new Date().toISOString(),
      };
      setChats((prev) => [localChat, ...prev]);
      setActiveChatId(localChat.id);
      setActiveTab('chats');
    }
  };

  const handleCreateGroup = (
    name: string,
    description: string,
    memberIds: string[],
    avatarUrl: string
  ) => {
    const selectedMembers = registeredUsers.filter((u) => memberIds.includes(u.id));
    const newGroup: Chat = {
      id: `chat-group-${Date.now()}`,
      type: 'group',
      name,
      avatar: avatarUrl,
      description,
      participants: [currentUser, ...selectedMembers],
      unreadCount: 0,
      isEncrypted: true,
      createdAt: new Date().toISOString(),
      lastMessage: {
        text: `${currentUser.name} created the group`,
        timestamp: 'Just now',
        status: 'sent',
      },
    };

    const initialGroupMsg: Message = {
      id: `init-${Date.now()}`,
      chatId: newGroup.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: `Created group "${name}". Tap encryption icon to inspect security keys.`,
      timestamp: 'Just now',
      status: 'sent',
    };

    setChats((prev) => [newGroup, ...prev]);
    setMessagesMap((prev) => ({
      ...prev,
      [newGroup.id]: [initialGroupMsg],
    }));
    setActiveChatId(newGroup.id);
    setShowGroupModal(false);
    setActiveTab('chats');
  };

  const handleOnboardingComplete = async (userData: Partial<User>) => {
    const updatedUser: User = {
      ...currentUser,
      ...userData,
      id: userData.id || currentUser.id || `user_${Date.now()}`,
    };
    setCurrentUser(updatedUser);
    sessionStorage.setItem('yapp_auth_active_user_id', updatedUser.id);
    try {
      await saveUserToFirestore(updatedUser);
      await recordCurrentDeviceSession(updatedUser.id);
    } catch (e) {
      console.warn('Failed saving user to firestore', e);
    }
    setAppStage('dashboard');
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    sessionStorage.removeItem('yapp_auth_active_user_id');
    setCurrentUser(DEFAULT_USER);
    setAppStage('onboarding');
    setActiveChatId(null);
  };

  const handleAddStory = (newStory: StatusStory) => {
    setStories((prev) => [newStory, ...prev]);
  };

  const handleUpdatePrivacy = (newSettings: Partial<PrivacySettings>) => {
    setPrivacySettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  // 1. Initial Authentication Check: show clean connecting splash
  if (isAuthChecking) {
    return <SplashScreen onFinish={() => {}} />;
  }

  // 2. If splash screen is explicitly requested for replay
  if (appStage === 'splash') {
    return (
      <SplashScreen 
        onFinish={() => {
          if (currentUser.name && currentUser.name.trim()) {
            setAppStage('dashboard');
          } else {
            setAppStage('onboarding');
          }
        }} 
      />
    );
  }

  // Render the inner application contents (either Onboarding or Main Dashboard)
  const appContent = (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-950">
      {appStage === 'onboarding' ? (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onReplaySplash={() => setAppStage('splash')}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          {/* FULL WIDTH LAYOUT:
              When a chat is active, the ChatArea occupies 100% full screen width (not half-screen).
              When no chat is active, the chats list / tab occupies 100% full screen width.
          */}
          {activeChatId && activeChat ? (
            /* FULL WIDTH CHAT INTERFACE */
            <div className="w-full h-full flex flex-col min-w-0 bg-slate-950">
              <ChatArea
                chat={activeChat}
                messages={activeMessages}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onStartCall={(type) => handleStartCallWithChat(activeChat, type)}
                onOpenChatInfo={() => setShowChatInfo(true)}
                onOpenPrivacyInfo={() => setShowPrivacyModal(true)}
                onBackToSidebar={() => setActiveChatId(null)}
              />
            </div>
          ) : (
            /* FULL WIDTH LIST & DASHBOARD INTERFACE */
            <div className="w-full h-full flex flex-col min-w-0 bg-slate-950 overflow-hidden">
              <div className="flex-1 w-full h-full overflow-hidden">
                {activeTab === 'chats' ? (
                  <Sidebar
                    chats={chats}
                    activeChatId={activeChatId}
                    onSelectChat={handleSelectChat}
                    onOpenNewChat={() => setShowNewChatModal(true)}
                    onOpenNewGroup={() => setShowGroupModal(true)}
                    onOpenPrivacyInfo={() => setShowPrivacyModal(true)}
                    currentUser={currentUser}
                    onReplaySplash={() => setAppStage('splash')}
                    onReplayOnboarding={() => setAppStage('onboarding')}
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setActiveChatId(null);
                    }}
                  />
                ) : activeTab === 'calls' ? (
                  <CallsHistoryView
                    callLogs={callLogs}
                    chats={chats}
                    registeredUsers={registeredUsers}
                    onStartCallWithChat={handleStartCallWithChat}
                    onStartCallWithUser={handleStartCallWithUser}
                    onBack={() => {
                      setActiveTab('chats');
                      setActiveChatId(null);
                    }}
                  />
                ) : activeTab === 'status' ? (
                  <StatusView
                    stories={stories}
                    currentUser={currentUser}
                    onAddStory={handleAddStory}
                    onBack={() => {
                      setActiveTab('chats');
                      setActiveChatId(null);
                    }}
                  />
                ) : (
                  <PrivacySettingsView
                    settings={privacySettings}
                    currentUser={currentUser}
                    onUpdateSettings={handleUpdatePrivacy}
                    onBack={() => {
                      setActiveTab('chats');
                      setActiveChatId(null);
                    }}
                    onSignOut={handleSignOut}
                  />
                )}
              </div>

              {/* Bottom Navigation Bar */}
              <nav
                id="main-bottom-navigation"
                aria-label="Main Navigation"
                className="flex items-center justify-around border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-2 py-2 shrink-0 z-30 select-none shadow-2xl max-w-2xl mx-auto w-full"
              >
                <button
                  id="nav-chats"
                  onClick={() => {
                    setActiveTab('chats');
                    setActiveChatId(null);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
                    activeTab === 'chats'
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200 font-medium'
                  }`}
                >
                  <div className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                        {chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] leading-none">Chats</span>
                </button>

                <button
                  id="nav-calls"
                  onClick={() => {
                    setActiveTab('calls');
                    setActiveChatId(null);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
                    activeTab === 'calls'
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200 font-medium'
                  }`}
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Calls</span>
                </button>

                <button
                  id="nav-status"
                  onClick={() => {
                    setActiveTab('status');
                    setActiveChatId(null);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
                    activeTab === 'status'
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200 font-medium'
                  }`}
                >
                  <Radio className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Status</span>
                </button>

                <button
                  id="nav-settings"
                  onClick={() => {
                    setActiveTab('settings');
                    setActiveChatId(null);
                  }}
                  className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
                    activeTab === 'settings'
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200 font-medium'
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span className="text-[11px] leading-none">Settings</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* New Chat & Real Device Contacts Modal */}
      {showNewChatModal && (
        <NewChatModal
          currentUser={currentUser}
          registeredUsers={registeredUsers}
          onSelectUser={handleSelectContactUser}
          onOpenNewGroup={() => {
            setShowNewChatModal(false);
            setShowGroupModal(true);
          }}
          onClose={() => setShowNewChatModal(false)}
        />
      )}

      {/* Calling Modal: Multi-participant up to 16 people & Low Data Adaptive mode */}
      {activeCall.isActive && activeCall.chat && (
        <CallModal
          chat={activeCall.chat}
          callType={activeCall.type}
          currentUser={currentUser}
          registeredUsers={registeredUsers}
          onEndCall={handleEndCall}
        />
      )}

      {/* Create New Group Modal */}
      {showGroupModal && (
        <GroupModal
          availableUsers={registeredUsers}
          onClose={() => setShowGroupModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {/* Chat & Group Info Details Modal */}
      {showChatInfo && activeChat && (
        <ChatInfoModal
          chat={activeChat}
          onClose={() => setShowChatInfo(false)}
          onStartCall={(type) => handleStartCallWithChat(activeChat, type)}
          onOpenPrivacyInfo={() => {
            setShowChatInfo(false);
            setShowPrivacyModal(true);
          }}
        />
      )}

      {/* End-to-End Encryption & Privacy Modal */}
      {showPrivacyModal && (
        <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
      )}
    </div>
  );

  return (
    <div 
      id="yapp-app-root" 
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none relative"
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* PWA Slide-Down Install Popup Banner */}
      <PWAInstallBanner />

      {/* Offline Status Badge */}
      <OfflineIndicator />

      <main className="flex-1 overflow-hidden relative flex items-center justify-center bg-slate-950 select-none">
        {appContent}
      </main>
    </div>
  );
}
