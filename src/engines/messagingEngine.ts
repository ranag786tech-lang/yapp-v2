/**
 * ============================================================================
 * ENGINE 2: REAL-TIME MESSAGING ENGINE (Firestore)
 * ============================================================================
 * 
 * Instant one-on-one messaging engine for "Yapp It" using Cloud Firestore.
 * 
 * Features:
 * - Strongly-typed schema definitions for Conversations & Messages.
 * - Real-time listeners ('onSnapshot') for incoming texts, media, & receipts.
 * - Delivery receipt updates ('sent' -> 'delivered' -> 'read').
 * - Automatic update of parent conversation `lastMessage` and timestamps.
 * - Zero 'any' types.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Unsubscribe,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ---------------------------------------------------------------------------
// Schema Definitions
// ---------------------------------------------------------------------------

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export type MessageContentType = 'text' | 'image' | 'audio' | 'document' | 'video';

export interface ParticipantProfile {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
}

export interface FirestoreMessagePayload {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string; // ISO string for client rendering
  serverTime?: Timestamp | ReturnType<typeof serverTimestamp>;
  status: MessageDeliveryStatus;
  mediaUrl?: string;
  mediaType?: MessageContentType;
  mediaName?: string;
  mediaSize?: string;
  audioDuration?: number;
}

export interface FirestoreConversationPayload {
  id: string;
  participantIds: [string, string];
  participants: ParticipantProfile[];
  lastMessage?: {
    text: string;
    timestamp: string;
    senderName: string;
    status: MessageDeliveryStatus;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Deterministically construct conversation ID for 1-on-1 chats.
 * Guarantees both users always open the exact same room document.
 */
export function getDirectChatId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
}

/**
 * Real-time Listener: Subscribe to messages in a specific conversation.
 * 
 * @param chatId Target chat document identifier
 * @param onMessages Callback returning chronological messages array
 * @param onError Optional error handler
 * @returns Unsubscribe function to release Firestore listener on unmount
 */
export function subscribeToConversation(
  chatId: string,
  onMessages: (messages: FirestoreMessagePayload[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!chatId) {
    onMessages([]);
    return () => {};
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: FirestoreMessagePayload[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          chatId: data.chatId || chatId,
          senderId: data.senderId || '',
          senderName: data.senderName || 'Unknown',
          senderAvatar: data.senderAvatar || '',
          text: data.text || '',
          timestamp: data.timestamp || new Date().toISOString(),
          status: (data.status as MessageDeliveryStatus) || 'sent',
          mediaUrl: data.mediaUrl || undefined,
          mediaType: data.mediaType || undefined,
          mediaName: data.mediaName || undefined,
          mediaSize: data.mediaSize || undefined,
          audioDuration: data.audioDuration || undefined,
        });
      });
      onMessages(messages);
    },
    (err) => {
      console.error(`[MessagingEngine] Failed to stream chat ${chatId}:`, err);
      if (onError) onError(new Error(err.message));
    }
  );
}

/**
 * Real-time Listener: Subscribe to all conversations the user is a member of.
 */
export function subscribeToUserConversations(
  userId: string,
  onConversations: (conversations: FirestoreConversationPayload[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onConversations([]);
    return () => {};
  }

  const chatsRef = collection(db, 'chats');
  const userChatsQuery = query(
    chatsRef,
    where('participantIds', 'array-contains', userId)
  );

  return onSnapshot(
    userChatsQuery,
    (snapshot) => {
      const list: FirestoreConversationPayload[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          participantIds: data.participantIds || [],
          participants: data.participants || [],
          lastMessage: data.lastMessage,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      // Sort by newest activity first
      list.sort((a, b) => {
        const timeA = new Date(a.lastMessage?.timestamp || a.updatedAt).getTime();
        const timeB = new Date(b.lastMessage?.timestamp || b.updatedAt).getTime();
        return timeB - timeA;
      });

      onConversations(list);
    },
    (err) => {
      console.error('[MessagingEngine] Failed to stream conversations:', err);
      if (onError) onError(new Error(err.message));
    }
  );
}

/**
 * Send a pure text message to a conversation.
 * Automatically synchronizes message document and parent chat preview.
 */
export async function sendTextMessage(
  chatId: string,
  sender: ParticipantProfile,
  text: string
): Promise<FirestoreMessagePayload> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('Message cannot be empty.');
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nowIso = new Date().toISOString();

  const messagePayload: FirestoreMessagePayload = {
    id: messageId,
    chatId,
    senderId: sender.id,
    senderName: sender.name,
    senderAvatar: sender.avatar || '',
    text: cleanText,
    timestamp: nowIso,
    status: 'sent',
  };

  const messageDocRef = doc(db, 'chats', chatId, 'messages', messageId);
  const chatDocRef = doc(db, 'chats', chatId);

  // Write message document
  await setDoc(messageDocRef, {
    ...messagePayload,
    serverTime: serverTimestamp(),
  });

  // Update parent chat conversation metadata
  await updateDoc(chatDocRef, {
    lastMessage: {
      text: cleanText,
      timestamp: nowIso,
      senderName: sender.name,
      status: 'sent',
    },
    updatedAt: nowIso,
  });

  return messagePayload;
}

/**
 * Update message delivery status ('sent' | 'delivered' | 'read').
 */
export async function updateMessageDeliveryStatus(
  chatId: string,
  messageId: string,
  status: MessageDeliveryStatus
): Promise<void> {
  if (!chatId || !messageId) return;

  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, {
    status,
    [`statusHistory.${status}At`]: new Date().toISOString(),
  });
}

/**
 * Mark all incoming unread messages in a chat as 'read'.
 */
export async function markConversationAsRead(
  chatId: string,
  currentUserId: string
): Promise<void> {
  if (!chatId || !currentUserId) return;

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const unreadQuery = query(
    messagesRef,
    where('status', 'in', ['sent', 'delivered'])
  );

  const snap = await getDocs(unreadQuery);
  if (snap.empty) return;

  const batch = writeBatch(db);
  let batchCount = 0;

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    // Only mark messages sent by the counterparty as read
    if (data.senderId !== currentUserId) {
      batch.update(docSnap.ref, { status: 'read' });
      batchCount++;
    }
  });

  if (batchCount > 0) {
    await batch.commit();
  }
}
