import { useState } from 'react';
import { 
  Search, 
  Users, 
  MessageSquare, 
  Lock, 
  Plus, 
  CheckCheck, 
  Phone,
  Settings as SettingsIcon,
  ShieldCheck,
  Pin,
  Radio,
  Camera,
  MoreVertical,
  MessageSquarePlus,
  Smartphone
} from 'lucide-react';
import { Chat, User } from '../types';
import { YappLogo } from './YappLogo';

export type SidebarTab = 'chats' | 'calls' | 'status' | 'settings';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenPrivacyInfo: () => void;
  currentUser: User;
  onReplaySplash?: () => void;
  onReplayOnboarding?: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

export const Sidebar = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenPrivacyInfo,
  currentUser,
  activeTab,
  onTabChange,
}: SidebarProps) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'direct' | 'group'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage?.text.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'unread') return chat.unreadCount > 0;
    if (filter === 'direct') return chat.type === 'direct';
    if (filter === 'group') return chat.type === 'group';
    return true;
  });

  return (
    <div id="app-sidebar" className="w-full h-full flex flex-col bg-slate-900 shrink-0 relative">
      {/* Top Header - Authentic, full-width WhatsApp layout */}
      <div id="sidebar-header" className="p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name || 'user'}`} 
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/60"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <YappLogo size={20} />
              <h1 className="font-extrabold text-base tracking-tight text-white">
                Yapp It
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
              {currentUser.phone || currentUser.name || 'End-to-End Encrypted'}
            </p>
          </div>
        </div>

        {/* Action buttons: New Chat + Privacy settings */}
        <div className="flex items-center gap-2">
          <button 
            type="button"
            id="header-new-chat-btn"
            onClick={onOpenNewChat}
            title="Start New Chat (View Device / SIM Contacts)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Chat</span>
            <span className="w-4 h-4 rounded-full bg-slate-950/20 flex items-center justify-center font-black text-xs leading-none ml-0.5">
              +
            </span>
          </button>

          <button 
            type="button"
            id="privacy-shield-btn"
            onClick={() => onTabChange('settings')}
            title="Privacy & Permissions Settings"
            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Feature Tabs (Chats, Calls, Status, Settings) */}
      <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 text-xs shrink-0 select-none">
        <button
          type="button"
          onClick={() => onTabChange('chats')}
          className={`py-3 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
            activeTab === 'chats'
              ? 'border-emerald-400 text-emerald-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4" />
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-slate-950 text-[9px] font-bold px-1 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <span className="text-[11px]">Chats</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('calls')}
          className={`py-3 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
            activeTab === 'calls'
              ? 'border-emerald-400 text-emerald-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span className="text-[11px]">Calls</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('status')}
          className={`py-3 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
            activeTab === 'status'
              ? 'border-emerald-400 text-emerald-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span className="text-[11px]">Status</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={`py-3 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
            activeTab === 'settings'
              ? 'border-emerald-400 text-emerald-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="text-[11px]">Settings</span>
        </button>
      </div>

      {/* Chats Tab View */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-chats-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats or messages..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                filter === 'unread'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread
            </button>
            <button
              type="button"
              onClick={() => setFilter('direct')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                filter === 'direct'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Direct
            </button>
            <button
              type="button"
              onClick={() => setFilter('group')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                filter === 'group'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredChats.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="max-w-xs space-y-1.5">
                <h3 className="text-base font-bold text-white">No chats yet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Start fresh with private encrypted messaging. Tap <strong>New Chat (+)</strong> to connect with real contacts from your device or SIM card.
                </p>
              </div>
              <button
                type="button"
                id="empty-state-new-chat-btn"
                onClick={onOpenNewChat}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Start New Chat</span>
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId && activeTab === 'chats';
              return (
                <div
                  key={chat.id}
                  id={`chat-item-${chat.id}`}
                  onClick={() => {
                    onTabChange('chats');
                    onSelectChat(chat.id);
                  }}
                  className={`p-3.5 flex items-center gap-3.5 cursor-pointer transition-colors relative ${
                    isActive 
                      ? 'bg-emerald-500/10 border-l-4 border-emerald-500' 
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={chat.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${chat.name}`}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {chat.type === 'direct' && (
                      <span 
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                          chat.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                        }`} 
                      />
                    )}
                    {chat.type === 'group' && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 text-white p-0.5 rounded-full ring-2 ring-slate-900">
                        <Users className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-sm text-slate-100 truncate">
                          {chat.name}
                        </span>
                        {chat.pinned && (
                          <Pin className="w-3 h-3 text-slate-400 shrink-0 rotate-45" />
                        )}
                      </div>
                      {chat.lastMessage && (
                        <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                          {chat.lastMessage.timestamp}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                        {chat.lastMessage?.status && (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {chat.lastMessage ? chat.lastMessage.text : 'Tap to chat...'}
                        </span>
                      </div>

                      {chat.unreadCount > 0 && (
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Action Button for New Chat (+) */}
        <button
          type="button"
          id="floating-new-chat-fab"
          onClick={onOpenNewChat}
          className="absolute bottom-16 right-6 p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-sm z-30 group cursor-pointer"
          title="New Chat (+)"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Bottom Profile Bar */}
        <div id="sidebar-footer" className="p-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-xs text-slate-400 truncate">
              Encrypted Real-Time Network
            </span>
          </div>

          <button 
            type="button"
            id="footer-new-chat-btn"
            onClick={onOpenNewChat}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <span>New Chat</span>
            <span className="w-4 h-4 rounded-full bg-slate-950/20 flex items-center justify-center font-black text-xs leading-none">+</span>
          </button>
        </div>
      </div>
    </div>
  );
};
