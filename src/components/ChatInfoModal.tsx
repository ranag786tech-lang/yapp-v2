import { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Bell, 
  BellOff, 
  Lock, 
  Clock, 
  Users, 
  Phone, 
  Video, 
  CheckCircle2 
} from 'lucide-react';
import { Chat } from '../types';

interface ChatInfoModalProps {
  chat: Chat;
  onClose: () => void;
  onStartCall: (type: 'audio' | 'video') => void;
  onOpenPrivacyInfo: () => void;
}

export const ChatInfoModal = ({
  chat,
  onClose,
  onStartCall,
  onOpenPrivacyInfo,
}: ChatInfoModalProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [disappearingActive, setDisappearingActive] = useState(false);

  return (
    <div id="chat-info-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="chat-info-container"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">
            {chat.type === 'group' ? 'Group Details' : 'Contact Details'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Profile overview */}
          <div className="flex flex-col items-center text-center">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-800 shadow-xl mb-3"
            />
            <h2 className="text-xl font-bold text-white mb-1">{chat.name}</h2>
            <p className="text-xs text-slate-400 max-w-xs">
              {chat.description || (chat.type === 'group' ? `${chat.participants.length} group members` : 'Available on Yapp It')}
            </p>

            {/* Quick Call buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  onClose();
                  onStartCall('audio');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700"
              >
                <Phone className="w-4 h-4 text-indigo-400" />
                Audio Call
              </button>
              <button
                onClick={() => {
                  onClose();
                  onStartCall('video');
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700"
              >
                <Video className="w-4 h-4 text-indigo-400" />
                Video Call
              </button>
            </div>
          </div>

          {/* Encryption card */}
          <div 
            onClick={onOpenPrivacyInfo}
            className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center justify-between cursor-pointer hover:bg-emerald-950/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-900/40 text-emerald-400 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300">End-to-End Encryption</h4>
                <p className="text-[11px] text-emerald-400/80">Messages and calls are fully secured</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 underline">Verify</span>
          </div>

          {/* Options */}
          <div className="space-y-2 bg-slate-850/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                {isMuted ? <BellOff className="w-4 h-4 text-slate-400" /> : <Bell className="w-4 h-4 text-slate-400" />}
                <span>Mute Notifications</span>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                  isMuted ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                    isMuted ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1.5 border-t border-slate-800/80">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Disappearing Messages</span>
              </div>
              <button
                onClick={() => setDisappearingActive(!disappearingActive)}
                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                  disappearingActive ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                    disappearingActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Members list for groups */}
          {chat.type === 'group' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Members ({chat.participants.length})
                </h4>
              </div>

              <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-850/40">
                {chat.participants.map((user) => (
                  <div key={user.id} className="p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">{user.name}</p>
                        <p className="text-[10px] text-slate-400">{user.about || user.phone}</p>
                      </div>
                    </div>
                    {user.id === 'user-me' && (
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
