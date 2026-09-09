import { X, ShieldCheck, Lock, KeyRound, EyeOff, ServerOff, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
}

export const PrivacyModal = ({ onClose }: PrivacyModalProps) => {
  return (
    <div id="privacy-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="privacy-modal-container"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Privacy & Security</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Your Privacy is Protected</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Yapp It incorporates state-of-the-art end-to-end encryption for all chats, media, and calls.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800 flex gap-3">
              <KeyRound className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">End-to-End Encryption</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Only you and the person you are communicating with can read messages or listen to calls. Not even Yapp It can intercept them.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800 flex gap-3">
              <EyeOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Zero-Knowledge Architecture</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Private keys remain strictly on your client device. Encrypted payloads cannot be decrypted by intermediate servers.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800 flex gap-3">
              <ServerOff className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white mb-0.5">Peer-to-Peer Calling Quality</h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Calls use direct peer-to-peer WebRTC connections with 48kHz Opus audio for ultra-low latency and crystal-clear clarity.
                </p>
              </div>
            </div>
          </div>

          {/* Safety number simulation */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Cryptographic Safety Number</span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="font-mono text-xs text-indigo-300 tracking-wider break-all bg-slate-900 p-2 rounded border border-slate-800">
              4912 8820 1943 0019 7731 5209 8812 6601
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
