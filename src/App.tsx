import { useState } from 'react';
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
import { 
  CURRENT_USER as DEFAULT_USER, 
  INITIAL_CHATS, 
  INITIAL_MESSAGES, 
  INITIAL_USERS, 
  INITIAL_CALL_LOGS,
  INITIAL_STORIES,
  DEFAULT_PRIVACY_SETTINGS,
  AUTO_REPLIES 
} from './data/mockData';
import { Chat, Message, User, CallLog, StatusStory, PrivacySettings } from './types';

export default function App() {
  // Navigation Flow State
  const [appStage, setAppStage] = useState<'splash' | 'onboarding' | 'dashboard'>('splash');
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');

  // Chat & Messaging State
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [activeChatId, setActiveChatId] = useState<string>(INITIAL_CHATS[0].id);

  // Calls & Status Stories State
  const [callLogs, setCallLogs] = useState<CallLog[]>(INITIAL_CALL_LOGS);
  const [stories, setStories] = useState<StatusStory[]>(INITIAL_STORIES);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);

  // Modals state
  const [activeCall, setActiveCall] = useState<{
    isActive: boolean;
    type: 'audio' | 'video';
    chat: Chat | null;
  }>({
    isActive: false,
    type: 'audio',
    chat: null,
  });
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const activeMessages = messagesMap[activeChatId] || [];

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileShowChat(true);

    // Clear unread count for selected chat
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
    );
  };

  const handleSendMessage = (
    text: string,
    mediaType?: 'image' | 'audio' | 'video' | 'file' | 'sticker' | 'gif',
    mediaUrl?: string,
    audioDuration?: string
  ) => {
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

    // Update messages for current chat
    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    // Update chat lastMessage
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

    // Simulate contact reply after 1.5 seconds if direct chat
    if (activeChat.type === 'direct') {
      setTimeout(() => {
        const replyText = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
        const replyMsg: Message = {
          id: `reply-${Date.now()}`,
          chatId: activeChatId,
          senderId: activeChat.participants.find((p) => p.id !== currentUser.id)?.id || 'user-other',
          senderName: activeChat.name,
          senderAvatar: activeChat.avatar,
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'delivered',
        };

        setMessagesMap((prev) => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), replyMsg],
        }));

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  lastMessage: {
                    text: replyText,
                    timestamp: replyMsg.timestamp,
                    senderName: activeChat.name,
                    status: 'delivered',
                  },
                }
              : c
          )
        );
      }, 1500);
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

  const handleStartCallWithUser = (user: User, type: 'audio' | 'video') => {
    let targetChat = chats.find((c) => c.type === 'direct' && c.participants.some((p) => p.id === user.id));
    if (!targetChat) {
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
    handleStartCallWithChat(targetChat, type);
  };

  const handleEndCall = () => {
    setActiveCall({
      isActive: false,
      type: 'audio',
      chat: null,
    });
  };

  const handleCreateGroup = (
    name: string,
    description: string,
    memberIds: string[],
    avatarUrl: string
  ) => {
    const selectedMembers = INITIAL_USERS.filter((u) => memberIds.includes(u.id));
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
    setMobileShowChat(true);
  };

  const handleOnboardingComplete = (userData: Partial<User>) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...userData,
    }));
    setAppStage('dashboard');
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

  // If splash screen is currently active
  if (appStage === 'splash') {
    return <SplashScreen onFinish={() => setAppStage('onboarding')} />;
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
        <div className="flex-1 flex h-full w-full overflow-hidden">
          {/* Left Column: Sidebar (Chat List & Primary Navigation) */}
          <div
            className={`h-full ${
              mobileShowChat && activeTab === 'chats'
                ? 'hidden md:flex'
                : activeTab !== 'chats'
                ? 'hidden md:flex'
                : 'flex w-full md:w-auto'
            }`}
          >
            <Sidebar
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              onOpenNewGroup={() => setShowGroupModal(true)}
              onOpenPrivacyInfo={() => setShowPrivacyModal(true)}
              currentUser={currentUser}
              onReplaySplash={() => setAppStage('splash')}
              onReplayOnboarding={() => setAppStage('onboarding')}
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setMobileShowChat(false);
              }}
            />
          </div>

          {/* Right Column / Active Screen Area */}
          <div
            className={`flex-1 h-full min-w-0 ${
              !mobileShowChat && activeTab === 'chats' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeTab === 'chats' ? (
              activeChat ? (
                <ChatArea
                  chat={activeChat}
                  messages={activeMessages}
                  currentUser={currentUser}
                  onSendMessage={handleSendMessage}
                  onStartCall={(type) => handleStartCallWithChat(activeChat, type)}
                  onOpenChatInfo={() => setShowChatInfo(true)}
                  onOpenPrivacyInfo={() => setShowPrivacyModal(true)}
                  onBackToSidebar={() => setMobileShowChat(false)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                  <h2 className="text-xl font-bold text-slate-300 mb-2">Welcome to Yapp It</h2>
                  <p className="text-sm max-w-sm">
                    Select a conversation or start a new group to connect with instant messaging, clear audio/video calling, and end-to-end encryption.
                  </p>
                </div>
              )
            ) : activeTab === 'calls' ? (
              <CallsHistoryView
                callLogs={callLogs}
                chats={chats}
                onStartCallWithChat={handleStartCallWithChat}
                onStartCallWithUser={handleStartCallWithUser}
                onBack={() => {
                  setActiveTab('chats');
                  setMobileShowChat(false);
                }}
              />
            ) : activeTab === 'status' ? (
              <StatusView
                stories={stories}
                currentUser={currentUser}
                onAddStory={handleAddStory}
                onBack={() => {
                  setActiveTab('chats');
                  setMobileShowChat(false);
                }}
              />
            ) : (
              <PrivacySettingsView
                settings={privacySettings}
                currentUser={currentUser}
                onUpdateSettings={handleUpdatePrivacy}
                onBack={() => {
                  setActiveTab('chats');
                  setMobileShowChat(false);
                }}
              />
            )}
          </div>

          {/* Mobile Bottom Navigation Bar (WhatsApp style) */}
          {!mobileShowChat && (
            <nav
              id="mobile-bottom-navigation"
              aria-label="Main Navigation"
              className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-2 py-2 shrink-0 z-30 select-none shadow-2xl"
            >
              <button
                id="mobile-nav-chats"
                onClick={() => {
                  setActiveTab('chats');
                  setMobileShowChat(false);
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
                id="mobile-nav-calls"
                onClick={() => {
                  setActiveTab('calls');
                  setMobileShowChat(false);
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
                id="mobile-nav-status"
                onClick={() => {
                  setActiveTab('status');
                  setMobileShowChat(false);
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
                id="mobile-nav-settings"
                onClick={() => {
                  setActiveTab('settings');
                  setMobileShowChat(false);
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
          )}
        </div>
      )}

      {/* Calling Modal: Multi-participant up to 16 people & Low Data Adaptive mode */}
      {activeCall.isActive && activeCall.chat && (
        <CallModal
          chat={activeCall.chat}
          callType={activeCall.type}
          currentUser={currentUser}
          onEndCall={handleEndCall}
        />
      )}

      {/* Create New Group Modal */}
      {showGroupModal && (
        <GroupModal
          availableUsers={INITIAL_USERS}
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
