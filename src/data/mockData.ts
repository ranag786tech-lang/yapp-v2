import { User, Chat, Message, CallLog, StatusStory, PrivacySettings } from '../types';

// Default empty user profile; will be populated from user setup & Firebase Auth
export const CURRENT_USER: User = {
  id: '',
  name: '',
  avatar: '',
  phone: '',
  about: 'Connecting on Yapp It 🚀 • Always end-to-end encrypted',
  isOnline: true,
};

// Zero dummy/hardcoded users - only real users registered in Firestore will appear
export const INITIAL_USERS: User[] = [];

// Zero dummy/hardcoded chats - starts fresh
export const INITIAL_CHATS: Chat[] = [];

// Zero dummy messages
export const INITIAL_MESSAGES: Record<string, Message[]> = {};

// Zero dummy call logs
export const INITIAL_CALL_LOGS: CallLog[] = [];

// Zero dummy status stories
export const INITIAL_STORIES: StatusStory[] = [];

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  lastSeen: 'everyone',
  profilePhoto: 'everyone',
  about: 'everyone',
  readReceipts: true,
  disappearingMessagesDefault: 'off',
  lowDataForCalls: false,
  endToEndEncryptionVerified: true,
  fingerprintLock: false,
  passkeyEnabled: true,
  passkeyCount: 1,
};

// No fake auto-replies
export const AUTO_REPLIES: string[] = [];
