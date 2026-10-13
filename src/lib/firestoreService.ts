import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Chat, Message, LinkedDevice } from '../types';
import { normalizePhoneNumber } from './phoneUtils';

/**
 * Real-time listener for all registered Yapp It users
 */
export function subscribeToRegisteredUsers(onUsersUpdate: (users: User[]) => void) {
  const usersRef = collection(db, 'users');
  return onSnapshot(usersRef, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        id: docSnap.id,
        name: data.name || 'Yapp User',
        avatar: data.photo || data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${docSnap.id}`,
        phone: data.phone || data.phoneNumber || '',
        about: data.about || 'Hey there! I am using Yapp It.',
        isOnline: data.online ?? data.isOnline ?? false,
        lastSeen: data.lastSeen || 'recently',
      });
    });
    onUsersUpdate(users);
  }, (error) => {
    console.error('Error listening to users in Firestore:', error);
  });
}

/**
 * Query Firestore to check if a user with given phone exists
 */
export async function searchUserByPhoneInFirestore(searchPhone: string): Promise<User | null> {
  if (!searchPhone) return null;
  const cleanTarget = normalizePhoneNumber(searchPhone);
  if (!cleanTarget) return null;

  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    let matchedUser: User | null = null;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const userPhone = data.phone || data.phoneNumber || '';
      const cleanUserPhone = normalizePhoneNumber(userPhone);

      if (cleanUserPhone && (cleanUserPhone === cleanTarget || cleanUserPhone.endsWith(cleanTarget) || cleanTarget.endsWith(cleanUserPhone))) {
        matchedUser = {
          id: docSnap.id,
          name: data.name || 'Yapp User',
          avatar: data.photo || data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${docSnap.id}`,
          phone: userPhone,
          about: data.about || 'Hey there! I am using Yapp It.',
          isOnline: data.online ?? data.isOnline ?? false,
          lastSeen: data.lastSeen || 'recently',
        };
      }
    });

    return matchedUser;
  } catch (err) {
    console.error('Error querying user by phone in Firestore:', err);
    return null;
  }
}

/**
 * Register or update the current user in Firestore
 * Storing both {phone, name, photo, online} and standard fields
 */
export async function saveUserToFirestore(user: User): Promise<void> {
  if (!user.id) return;
  const userDocRef = doc(db, 'users', user.id);
  await setDoc(userDocRef, {
    id: user.id,
    name: user.name,
    phone: user.phone || '',
    phoneNumber: user.phone || '',
    photo: user.avatar || '',
    avatar: user.avatar || '',
    about: user.about || 'Hey there! I am using Yapp It.',
    online: true,
    isOnline: true,
    lastSeen: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Update real-time presence
 */
export async function updateUserPresence(userId: string, isOnline: boolean): Promise<void> {
  if (!userId) return;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      online: isOnline,
      isOnline,
      lastSeen: new Date().toISOString()
    });
  } catch (err) {
    // If doc doesn't exist yet, ignore
  }
}

/**
 * Real-time listener for active chats involving the user
 */
export function subscribeToUserChats(userId: string, onChatsUpdate: (chats: Chat[]) => void) {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participantIds', 'array-contains', userId));

  return onSnapshot(q, (snapshot) => {
    const chats: Chat[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      chats.push({
        id: docSnap.id,
        type: data.type || 'direct',
        name: data.name || 'Chat',
        avatar: data.avatar || '',
        participants: data.participants || [],
        lastMessage: data.lastMessage,
        unreadCount: 0,
        isOnline: data.isOnline ?? false,
        isEncrypted: true,
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });

    // Sort by most recent
    chats.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || a.createdAt;
      const timeB = b.lastMessage?.timestamp || b.createdAt;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    onChatsUpdate(chats);
  }, (error) => {
    console.error('Error listening to chats:', error);
  });
}

/**
 * Real-time listener for messages in a chat
 */
export function subscribeToChatMessages(chatId: string, onMessagesUpdate: (messages: Message[]) => void) {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        chatId: data.chatId || chatId,
        senderId: data.senderId,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        text: data.text || '',
        timestamp: data.timestamp || new Date().toISOString(),
        status: data.status || 'delivered',
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        mediaName: data.mediaName,
        mediaSize: data.mediaSize,
        audioDuration: data.audioDuration,
      });
    });
    onMessagesUpdate(messages);
  }, (error) => {
    console.error('Error listening to chat messages:', error);
  });
}

/**
 * Create or get a direct chat between two users
 */
export async function getOrCreateDirectChat(currentUser: User, targetUser: User): Promise<Chat> {
  const sortedIds = [currentUser.id, targetUser.id].sort();
  const chatId = `chat_${sortedIds[0]}_${sortedIds[1]}`;
  const chatDocRef = doc(db, 'chats', chatId);

  const existingDoc = await getDoc(chatDocRef);
  if (existingDoc.exists()) {
    const data = existingDoc.data();
    return {
      id: chatId,
      type: 'direct',
      name: targetUser.name,
      avatar: targetUser.avatar,
      participants: [currentUser, targetUser],
      lastMessage: data.lastMessage,
      unreadCount: 0,
      isOnline: targetUser.isOnline,
      isEncrypted: true,
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  const newChat: Chat = {
    id: chatId,
    type: 'direct',
    name: targetUser.name,
    avatar: targetUser.avatar,
    participants: [currentUser, targetUser],
    unreadCount: 0,
    isOnline: targetUser.isOnline,
    isEncrypted: true,
    createdAt: new Date().toISOString()
  };

  await setDoc(chatDocRef, {
    id: chatId,
    type: 'direct',
    name: targetUser.name,
    avatar: targetUser.avatar,
    participantIds: [currentUser.id, targetUser.id],
    participants: [
      { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, phone: currentUser.phone || '' },
      { id: targetUser.id, name: targetUser.name, avatar: targetUser.avatar, phone: targetUser.phone || '' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return newChat;
}

/**
 * Send a message to Firestore and update the parent chat's lastMessage
 */
export async function sendMessageToFirestore(chatId: string, message: Message): Promise<void> {
  const msgDocRef = doc(db, 'chats', chatId, 'messages', message.id);
  await setDoc(msgDocRef, {
    id: message.id,
    chatId,
    senderId: message.senderId,
    senderName: message.senderName,
    senderAvatar: message.senderAvatar || '',
    text: message.text,
    timestamp: message.timestamp,
    status: 'delivered',
    mediaUrl: message.mediaUrl || null,
    mediaType: message.mediaType || null,
    mediaName: message.mediaName || null,
    mediaSize: message.mediaSize || null,
    audioDuration: message.audioDuration || null
  });

  const chatDocRef = doc(db, 'chats', chatId);
  await updateDoc(chatDocRef, {
    lastMessage: {
      text: message.text || (message.mediaType ? `[${message.mediaType}]` : ''),
      timestamp: message.timestamp,
      senderName: message.senderName,
      status: 'delivered'
    },
    updatedAt: message.timestamp
  });
}

// ==========================================
// 1. DYNAMIC DEVICE MANAGEMENT (ZERO MOCKS)
// ==========================================

const SESSION_STORAGE_KEY = 'yapp_active_device_session_id';

export function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'dev_current';
  }
}

function getClientDeviceInfo(): {
  platform: 'web' | 'mobile' | 'desktop' | 'tablet';
  browserOrOs: string;
  name: string;
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let platform: 'web' | 'mobile' | 'desktop' | 'tablet' = 'web';
  if (/iPad|Tablet/i.test(ua)) platform = 'tablet';
  else if (/Mobile|Android|iPhone/i.test(ua)) platform = 'mobile';
  else if (/Macintosh|Windows|Linux/i.test(ua)) platform = 'desktop';

  let browser = 'Chrome';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edg/i.test(ua)) browser = 'Edge';

  let os = 'OS';
  if (/Mac/i.test(ua)) os = 'macOS';
  else if (/Win/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';

  return {
    platform,
    browserOrOs: `${browser} on ${os}`,
    name: platform === 'desktop' || platform === 'web' ? 'Yapp It Web' : 'Yapp It Mobile',
  };
}

/**
 * Record authentic active device session to Firestore users/{uid}/devices
 */
export async function recordCurrentDeviceSession(userId: string): Promise<LinkedDevice> {
  if (!userId) {
    throw new Error('User ID required to record session');
  }

  const sessionId = getOrCreateSessionId();
  const info = getClientDeviceInfo();
  let location = 'Current Session';
  try {
    location = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Current Session';
  } catch (_) {}

  const device: LinkedDevice = {
    id: sessionId,
    name: info.name,
    platform: info.platform,
    browserOrOs: info.browserOrOs,
    lastActive: 'Active now (This browser)',
    isCurrent: true,
    location,
  };

  const deviceDocRef = doc(db, 'users', userId, 'devices', sessionId);
  await setDoc(deviceDocRef, {
    ...device,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }, { merge: true });

  return device;
}

/**
 * Subscribe in real time to authentic linked devices for this user
 */
export function subscribeToUserDevices(
  userId: string,
  onDevicesUpdate: (devices: LinkedDevice[]) => void
) {
  if (!userId) {
    onDevicesUpdate([]);
    return () => {};
  }

  const devicesRef = collection(db, 'users', userId, 'devices');
  const currentSessionId = getOrCreateSessionId();

  return onSnapshot(devicesRef, (snapshot) => {
    const devices: LinkedDevice[] = [];
    snapshot.forEach((dSnap) => {
      const data = dSnap.data();
      const isCurrent = dSnap.id === currentSessionId;
      devices.push({
        id: dSnap.id,
        name: data.name || 'Yapp It Client',
        platform: data.platform || 'web',
        browserOrOs: data.browserOrOs || 'Web Browser',
        lastActive: isCurrent ? 'Active now (This browser)' : (data.lastActive || 'Recently'),
        isCurrent,
        location: data.location || 'Current Session',
      });
    });

    onDevicesUpdate(devices);
  }, (err) => {
    console.warn('User devices subscription note:', err);
    onDevicesUpdate([]);
  });
}

/**
 * Unlink and delete authentic session from Firestore
 */
export async function unlinkUserDevice(userId: string, deviceId: string): Promise<void> {
  if (!userId || !deviceId) return;
  const deviceDocRef = doc(db, 'users', userId, 'devices', deviceId);
  await deleteDoc(deviceDocRef);
}

// ==============================================================
// 2. PERSISTENT PERMISSION SYNCHRONIZATION (users/{uid}/settings)
// ==============================================================

export const DEFAULT_PERMISSION_STATES: Record<string, boolean> = {
  camera: true,
  microphone: true,
  contacts: true,
  notifications: true,
  biometric: true,
  phone: true,
  sms: true,
  location: false,
  storage: true,
  network: true,
  foreground: true,
  screen_guard: true,
  bluetooth: true,
};

/**
 * Store permission states within the Firestore path: users/{uid}/settings
 */
export async function saveUserPermissions(
  userId: string,
  permissions: Record<string, boolean>
): Promise<void> {
  if (!userId) return;

  const permissionsDocRef = doc(db, 'users', userId, 'settings', 'permissions');
  const settingsDocRef = doc(db, 'users', userId, 'settings', 'settings');
  const payload = {
    permissions,
    camera: permissions.camera ?? true,
    microphone: permissions.microphone ?? true,
    contacts: permissions.contacts ?? true,
    notifications: permissions.notifications ?? true,
    updatedAt: new Date().toISOString(),
  };

  try {
    await Promise.all([
      setDoc(permissionsDocRef, payload, { merge: true }),
      setDoc(settingsDocRef, payload, { merge: true }),
    ]);
  } catch (err) {
    console.error('Error saving permissions to Firestore path users/{uid}/settings:', err);
  }
}

/**
 * Fetch current settings document from Firestore path: users/{uid}/settings
 */
export async function getUserPermissions(
  userId: string
): Promise<Record<string, boolean>> {
  if (!userId) return DEFAULT_PERMISSION_STATES;

  try {
    const permSnap = await getDoc(doc(db, 'users', userId, 'settings', 'permissions'));
    if (permSnap.exists() && permSnap.data().permissions) {
      return { ...DEFAULT_PERMISSION_STATES, ...permSnap.data().permissions };
    }

    const settingsSnap = await getDoc(doc(db, 'users', userId, 'settings', 'settings'));
    if (settingsSnap.exists() && settingsSnap.data().permissions) {
      return { ...DEFAULT_PERMISSION_STATES, ...settingsSnap.data().permissions };
    }
  } catch (err) {
    console.warn('Note reading permissions from users/{uid}/settings:', err);
  }

  return DEFAULT_PERMISSION_STATES;
}

/**
 * Fetch profile from Firestore
 */
export async function getUserProfileFromFirestore(userId: string): Promise<User | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        name: data.name || '',
        avatar: data.photo || data.avatar || '',
        phone: data.phone || data.phoneNumber || '',
        about: data.about || 'Hey there! I am using Yapp It.',
        isOnline: data.online ?? data.isOnline ?? false,
        lastSeen: data.lastSeen || 'recently',
      };
    }
  } catch (err) {
    console.error('Error fetching user profile from Firestore:', err);
  }
  return null;
}
