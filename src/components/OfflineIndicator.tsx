import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      id="pwa-offline-indicator"
      className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 bg-slate-900/95 border border-amber-500/40 text-slate-100 px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Offline Mode Active</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          </p>
          <p className="text-[11px] text-slate-300 truncate">
            Service worker cached chats &amp; data are available.
          </p>
        </div>
      </div>

      <div className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 shrink-0 font-medium">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>Cached</span>
      </div>
    </div>
  );
};
