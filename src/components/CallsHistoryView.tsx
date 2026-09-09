import { useState } from 'react';
import { 
  Phone, 
  Video, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Link as LinkIcon, 
  Plus, 
  Users, 
  ShieldCheck, 
  Search,
  Check,
  ArrowLeft
} from 'lucide-react';
import { CallLog, Chat, User } from '../types';
import { INITIAL_USERS } from '../data/mockData';

interface CallsHistoryViewProps {
  callLogs: CallLog[];
  chats: Chat[];
  onStartCallWithChat: (chat: Chat, type: 'audio' | 'video') => void;
  onStartCallWithUser: (user: User, type: 'audio' | 'video') => void;
  onBack?: () => void;
}

export const CallsHistoryView = ({
  callLogs,
  chats,
  onStartCallWithChat,
  onStartCallWithUser,
  onBack,
}: CallsHistoryViewProps) => {
  const [search, setSearch] = useState('');
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [showLinkCopied, setShowLinkCopied] = useState(false);

  const filteredLogs = callLogs.filter((log) =>
    log.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyCallLink = () => {
    navigator.clipboard?.writeText?.('https://yappit.app/call/e2e-sec-' + Math.random().toString(36).substring(2, 8));
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 2500);
  };

  const handleCallFromLog = (log: CallLog) => {
    // Find matching chat or user
    const matchingChat = chats.find((c) => c.name === log.name);
    if (matchingChat) {
      onStartCallWithChat(matchingChat, log.type);
    } else {
      const matchingUser = INITIAL_USERS.find((u) => u.name === log.name) || INITIAL_USERS[0];
      onStartCallWithUser(matchingUser, log.type);
    }
  };

  return (
    <div id="calls-history-view" className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              id="calls-back-button"
              onClick={onBack}
              className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 rounded-full transition-colors flex items-center justify-center shrink-0"
              title="Back to Chats"
              aria-label="Back to Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Calls</h1>
            <p className="text-xs text-slate-400">Clear audio &amp; video calls up to 16 participants</p>
          </div>
        </div>

        <button
          id="start-new-call-btn"
          onClick={() => setShowNewCallModal(true)}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-md font-semibold flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Call</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recent calls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70 p-2 sm:p-3">
        {/* Create Call Link Item */}
        <div
          id="create-call-link-card"
          onClick={handleCopyCallLink}
          className="p-3.5 mb-2 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create call link</h3>
              <p className="text-xs text-slate-400">Share an end-to-end encrypted link for your Yapp call</p>
            </div>
          </div>

          <div className="text-xs font-semibold text-emerald-400 px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            {showLinkCopied ? (
              <span className="flex items-center gap-1 text-emerald-300">
                <Check className="w-3.5 h-3.5" /> Copied!
              </span>
            ) : (
              'Copy Link'
            )}
          </div>
        </div>

        {/* Section title */}
        <div className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Recent Calls
        </div>

        {/* Call Logs */}
        {filteredLogs.map((log) => {
          return (
            <div
              key={log.id}
              className="p-3 flex items-center justify-between hover:bg-slate-800/50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={log.avatar}
                    alt={log.name}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  {log.isGroup && (
                    <span className="absolute -bottom-1 -right-1 bg-indigo-600 p-1 rounded-full text-white text-[9px]">
                      <Users className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h4
                      className={`text-sm font-semibold ${
                        log.direction === 'missed' ? 'text-red-400' : 'text-slate-100'
                      }`}
                    >
                      {log.name}
                    </h4>
                    {log.participantsCount && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-md border border-slate-700">
                        {log.participantsCount} people
                      </span>
                    )}
                  </div>

                  {/* Direction & time */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    {log.direction === 'incoming' && (
                      <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {log.direction === 'outgoing' && (
                      <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {log.direction === 'missed' && (
                      <PhoneMissed className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span>{log.timestamp}</span>
                    {log.duration && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{log.duration}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Call Action */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCallFromLog({ ...log, type: 'audio' })}
                  title="Audio Call"
                  className="p-2 text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleCallFromLog({ ...log, type: 'video' })}
                  title="Video Call"
                  className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-colors"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom encryption assurance */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Your personal and group calls are end-to-end encrypted</span>
      </div>

      {/* New Call Contact Picker Modal */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">New Call</h3>
              <button
                onClick={() => setShowNewCallModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-400 my-2">
              Select a contact to start an encrypted audio or HD video call.
            </p>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 my-2">
              {INITIAL_USERS.map((user) => (
                <div
                  key={user.id}
                  className="p-2.5 flex items-center justify-between hover:bg-slate-800/80 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{user.name}</p>
                      <p className="text-[10px] text-slate-400">{user.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setShowNewCallModal(false);
                        onStartCallWithUser(user, 'audio');
                      }}
                      className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg"
                      title="Audio Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCallModal(false);
                        onStartCallWithUser(user, 'video');
                      }}
                      className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
