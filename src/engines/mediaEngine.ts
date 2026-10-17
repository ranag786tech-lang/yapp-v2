/**
 * ============================================================================
 * ENGINE 3: MEDIA STORAGE HUB (Firebase Storage)
 * ============================================================================
 * 
 * Media storage pipeline for "Yapp It".
 * 
 * Features:
 * - Binary media upload (Images, Audio Voice Notes, Documents/Files, Video).
 * - Live upload progress callback and content-type detection.
 * - Secure download URL generation.
 * - Nicely packages results into Firestore message payloads.
 * - Strictly typed: Zero 'any' types.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadMetadata,
} from 'firebase/storage';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import {
  FirestoreMessagePayload,
  MessageContentType,
  ParticipantProfile,
} from './messagingEngine';

export interface MediaUploadOptions {
  chatId: string;
  senderId: string;
  fileName?: string;
  customFolder?: 'images' | 'audio' | 'documents' | 'videos';
  onProgress?: (progressPercentage: number) => void;
}

export interface MediaUploadResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  mediaType: MessageContentType;
  fileSizeFormatted: string;
  mimeType: string;
}

/**
 * Determine high-level category from MIME type.
 */
function classifyMimeType(mime: string): MessageContentType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

/**
 * Format bytes into human-friendly representation (KB, MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Engine Function: Upload binary media (File or Blob) to Firebase Storage.
 * Returns the download URL and metadata.
 */
export async function uploadMediaFile(
  file: File | Blob,
  options: MediaUploadOptions
): Promise<MediaUploadResult> {
  const mimeType = file.type || 'application/octet-stream';
  const mediaType = classifyMimeType(mimeType);

  const fallbackName = `${mediaType}_${Date.now()}`;
  const originalName = file instanceof File ? file.name : (options.fileName || fallbackName);

  // Sanitize file extension and path
  const folder = options.customFolder || `${mediaType}s`;
  const storagePath = `chats/${options.chatId}/${folder}/${Date.now()}_${originalName.replace(/[^\w.-]/g, '_')}`;
  const fileRef = ref(storage, storagePath);

  const metadata: UploadMetadata = {
    contentType: mimeType,
    customMetadata: {
      uploadedBy: options.senderId,
      chatId: options.chatId,
    },
  };

  const uploadTask = uploadBytesResumable(fileRef, file, metadata);

  return new Promise<MediaUploadResult>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (options.onProgress && snapshot.totalBytes > 0) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          options.onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('[MediaEngine] Upload failed:', error);
        reject(new Error(`Media upload failed: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: originalName,
            mediaType,
            fileSizeFormatted: formatBytes(file.size),
            mimeType,
          });
        } catch (fetchErr: unknown) {
          const err = fetchErr as Error;
          reject(new Error(`Failed to retrieve download URL: ${err.message}`));
        }
      }
    );
  });
}

/**
 * Engine Function: Upload file and immediately package & dispatch
 * it as a Firestore message into the active conversation.
 */
export async function sendMediaMessage(
  chatId: string,
  sender: ParticipantProfile,
  mediaFile: File | Blob,
  caption?: string,
  audioDurationSeconds?: number,
  onProgress?: (progress: number) => void
): Promise<FirestoreMessagePayload> {
  // Step 1: Upload to Storage
  const mediaResult = await uploadMediaFile(mediaFile, {
    chatId,
    senderId: sender.id,
    fileName: mediaFile instanceof File ? mediaFile.name : undefined,
    onProgress,
  });

  // Step 2: Package into Firestore Message Payload
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const nowIso = new Date().toISOString();

  const previewText = caption?.trim() 
    ? caption.trim() 
    : mediaResult.mediaType === 'audio' 
      ? '🎤 Voice Message' 
      : mediaResult.mediaType === 'image' 
        ? '📷 Photo' 
        : `📎 ${mediaResult.fileName}`;

  const messagePayload: FirestoreMessagePayload = {
    id: messageId,
    chatId,
    senderId: sender.id,
    senderName: sender.name,
    senderAvatar: sender.avatar || '',
    text: caption?.trim() || '',
    timestamp: nowIso,
    status: 'sent',
    mediaUrl: mediaResult.downloadUrl,
    mediaType: mediaResult.mediaType,
    mediaName: mediaResult.fileName,
    mediaSize: mediaResult.fileSizeFormatted,
    audioDuration: audioDurationSeconds,
  };

  // Step 3: Write to Firestore Subcollection
  const msgDocRef = doc(db, 'chats', chatId, 'messages', messageId);
  const chatDocRef = doc(db, 'chats', chatId);

  await setDoc(msgDocRef, {
    ...messagePayload,
    serverTime: serverTimestamp(),
  });

  // Step 4: Update Conversation Last Message Preview
  await updateDoc(chatDocRef, {
    lastMessage: {
      text: previewText,
      timestamp: nowIso,
      senderName: sender.name,
      status: 'sent',
    },
    updatedAt: nowIso,
  });

  return messagePayload;
}
