export interface User {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  emoji: string;
  users: string[]; // user IDs
}

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple?: boolean;
  createdBy: string;
  createdAt: string;
  isClosed?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  status: MessageStatus;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'file' | 'sticker' | 'gif';
  mediaName?: string;
  mediaSize?: string;
  audioDuration?: string;
  poll?: PollData;
  mentions?: string[];
  reactions?: Record<string, number>; // emoji -> count
  myReaction?: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  description?: string;
  participants: User[];
  lastMessage?: {
    text: string;
    timestamp: string;
    senderName?: string;
    status?: MessageStatus;
  };
  unreadCount: number;
  isOnline?: boolean;
  isEncrypted: boolean;
  createdAt: string;
  pinned?: boolean;
}

export interface CallParticipant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking?: boolean;
  networkQuality: 'excellent' | 'good' | 'low';
}

export interface CallState {
  isActive: boolean;
  type: 'audio' | 'video';
  chat: Chat | null;
  participants: CallParticipant[];
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isLowDataMode: boolean;
  isSpatialAudio?: boolean;
  isNoiseSuppression?: boolean;
  duration: number;
  isConnecting: boolean;
  platform?: 'web' | 'desktop' | 'mobile';
}

export interface CallLog {
  id: string;
  name: string;
  avatar: string;
  isGroup?: boolean;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string;
  participantsCount?: number;
  isWebCall?: boolean;
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  caption?: string;
  timestamp: string;
  isViewed?: boolean;
}

export interface LinkedDevice {
  id: string;
  name: string;
  platform: 'web' | 'desktop' | 'tablet' | 'mobile';
  browserOrOs: string;
  lastActive: string;
  isCurrent?: boolean;
  location?: string;
}

export interface PrivacySettings {
  lastSeen: 'everyone' | 'contacts' | 'nobody';
  profilePhoto: 'everyone' | 'contacts' | 'nobody';
  about: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  disappearingMessagesDefault: 'off' | '24h' | '7d' | '90d';
  lowDataForCalls: boolean;
  endToEndEncryptionVerified: boolean;
  fingerprintLock?: boolean;
  passkeyEnabled?: boolean;
  passkeyCount?: number;
  linkedDevices?: LinkedDevice[];
}
