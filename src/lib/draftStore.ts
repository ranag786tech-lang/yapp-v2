import { useState, useEffect } from 'react';

const DRAFTS_STORAGE_KEY = 'yapp_chat_drafts';

/**
 * Retrieve all currently saved un-sent message drafts
 */
export function getChatDrafts(): Record<string, string> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.warn('Error reading chat drafts from localStorage:', err);
    return {};
  }
}

/**
 * Retrieve an un-sent message draft for a specific chat
 */
export function getChatDraft(chatId: string): string {
  if (!chatId) return '';
  const drafts = getChatDrafts();
  return drafts[chatId] || '';
}

/**
 * Persist an un-sent draft message for a chat
 * If text is empty or only whitespace, automatically deletes the draft entry
 */
export function saveChatDraft(chatId: string, text: string): void {
  if (!chatId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const drafts = getChatDrafts();
    if (!text || text.trim() === '') {
      if (chatId in drafts) {
        delete drafts[chatId];
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
        window.dispatchEvent(new CustomEvent('yapp-draft-change', { detail: { chatId, text: '' } }));
      }
    } else {
      if (drafts[chatId] !== text) {
        drafts[chatId] = text;
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
        window.dispatchEvent(new CustomEvent('yapp-draft-change', { detail: { chatId, text } }));
      }
    }
  } catch (err) {
    console.warn('Error saving chat draft to localStorage:', err);
  }
}

/**
 * Clear the draft for a chat when sent or discarded
 */
export function clearChatDraft(chatId: string): void {
  if (!chatId || typeof window === 'undefined' || !window.localStorage) return;
  try {
    const drafts = getChatDrafts();
    if (chatId in drafts) {
      delete drafts[chatId];
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
      window.dispatchEvent(new CustomEvent('yapp-draft-change', { detail: { chatId, text: '' } }));
    }
  } catch (err) {
    console.warn('Error clearing chat draft from localStorage:', err);
  }
}

/**
 * React hook to reactively observe un-sent message drafts across chats
 */
export function useChatDrafts(): Record<string, string> {
  const [drafts, setDrafts] = useState<Record<string, string>>(() => getChatDrafts());

  useEffect(() => {
    const updateDrafts = () => {
      setDrafts(getChatDrafts());
    };

    window.addEventListener('yapp-draft-change', updateDrafts);
    window.addEventListener('storage', updateDrafts);

    return () => {
      window.removeEventListener('yapp-draft-change', updateDrafts);
      window.removeEventListener('storage', updateDrafts);
    };
  }, []);

  return drafts;
}
