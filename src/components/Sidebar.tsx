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
  MoreVertical
} from 'lucide-react';
import { Chat, User } from '../types';
import { YappLogo } from './YappLogo';

export type SidebarTab = 'chats' | 'calls' | 'status' | 'settings';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
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
    <div id="app-sidebar" className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-slate-900 border-r border-slate-800 shrink-0">
      {/* Top Header - Authentic and clean, no debug clutter */}
      <div id="sidebar-header" className="p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/95">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={currentUser.avatar} 
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
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]">
              {currentUser.phone || '+91 98765 43210'}
            </p>
          </div>
        </div>

        {/* Action icons like real WhatsApp */}
        <div className="flex items-center gap-1">
          <button 
            id="create-group-btn"
            onClick={onOpenNewGroup}
            title="Create New Group"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
          </button>
          <button 
            id="privacy-shield-btn"
            onClick={() => onTabChange('settings')}
            title="Privacy & Permissions Settings"
            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Feature Tabs (Chats, Calls, Status, Settings) */}
      <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/60 text-xs shrink-0 select-none">
        <button
          onClick={() => onTabChange('chats')}
          className={`py-2.5 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
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
          <span className="text-[10px]">Chats</span>
        </button>

        <button
          onClick={() => onTabChange('calls')}
          className={`py-2.5 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
            activeTab === 'calls'
              ? 'border-emerald-400 text-emerald-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span className="text-[10px]">Calls</span>
        </button>

        <button
          onClick={() => onTabChange('status')}
          className={`py-2.5 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
            activeTab === 'status'
              ? 'border-emerald-400 text-emerald-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span className="text-[10px]">Status</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`py-2.5 flex flex-col items-center justify-center gap-1 transition-all border-b-2 ${
            activeTab === 'settings'
              ? 'border-emerald-400 text-emerald-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="text-[10px]">Settings</span>
        </button>
      </div>

      {/* When in Chats Tab, show Search, Filters, and Chat List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Security notice bar */}
        <div 
          id="encryption-badge" 
          onClick={onOpenPrivacyInfo}
          className="mx-3 mt-3 px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 cursor-pointer hover:bg-emerald-950/60 transition-colors shrink-0"
        >
          <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span className="truncate text-[11px]">End-to-end encrypted chats &amp; calls</span>
          <span className="ml-auto text-[9px] font-bold text-emerald-400 shrink-0">VIEW</span>
        </div>

        {/* Search Input */}
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="chat-search-input"
              type="text"
              placeholder="Search chats, groups, or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                filter === 'all' 
                  ? 'bg-emerald-500 text-slate-950 font-bold' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                filter === 'unread' 
                  ? 'bg-emerald-500 text-slate-950 font-bold' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('direct')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                filter === 'direct' 
                  ? 'bg-emerald-500 text-slate-950 font-bold' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => setFilter('group')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                filter === 'group' 
                  ? 'bg-emerald-500 text-slate-950 font-bold' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div id="chats-scroll-list" className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No chats found
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
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-colors relative ${
                    isActive 
                      ? 'bg-emerald-500/10 border-l-2 border-emerald-500' 
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={chat.avatar}
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
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {chat.lastMessage ? chat.lastMessage.text : 'Start conversation...'}
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

        {/* Bottom Profile Bar */}
        <div id="sidebar-footer" className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-xs text-slate-400 truncate">
              Yapp Network: <strong className="text-emerald-400 font-medium">Encrypted</strong>
            </span>
          </div>
          <button 
            onClick={onOpenNewGroup}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Group
          </button>
        </div>
      </div>
    </div>
  );
};
