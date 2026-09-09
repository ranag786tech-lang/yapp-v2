import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Chat, Message } from '../types';
import { matchPhoneNumbers } from './phoneUtils';

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
        avatar: data.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${docSnap.id}`,
        phone: data.phoneNumber || data.phone || '',
        about: data.about || 'Hey there! I am using Yapp It.',
        isOnline: data.isOnline ?? false,
        lastSeen: data.lastSeen || 'recently',
      });
    });
    onUsersUpdate(users);
  }, (error) => {
    console.error('Error listening to users in Firestore:', error);
  });
}

/**
 * Register or update the current user in Firestore
 */
export async function saveUserToFirestore(user: User): Promise<void> {
  if (!user.id) return;
  const userDocRef = doc(db, 'users', user.id);
  await setDoc(userDocRef, {
    id: user.id,
    name: user.name,
    phoneNumber: user.phone || '',
    avatar: user.avatar,
    about: user.about || 'Hey there! I am using Yapp It.',
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
  return onSnapshot(chatsRef, (snapshot) => {
    const chats: Chat[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const participantIds: string[] = data.participantIds || [];
      if (participantIds.includes(userId)) {
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
      }
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
  // Deterministic chatId so both parties share the exact same room
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
