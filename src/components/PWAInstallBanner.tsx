import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { 
    showBanner, 
    isInstalled, 
    isIOS, 
    hasNativePrompt, 
    installSuccess, 
    install, 
    dismissBanner 
  } = usePWAInstall();

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [justSimulatedInstalled, setJustSimulatedInstalled] = useState(false);

  // If already installed as standalone PWA, don't show the banner
  if (isInstalled && !justSimulatedInstalled) {
    return null;
  }

  const handleAddToHome = async () => {
    setIsInstalling(true);
    if (hasNativePrompt) {
      const accepted = await install();
      setIsInstalling(false);
      if (accepted) {
        setJustSimulatedInstalled(true);
      }
    } else if (isIOS) {
      setIsInstalling(false);
      setShowIOSGuide(true);
    } else {
      // In browsers where beforeinstallprompt was already consumed or in desktop/iframe preview
      setIsInstalling(false);
      // Try install or show guided installation
      const accepted = await install();
      if (!accepted) {
        setShowManualGuide(true);
      }
    }
  };

  return (
    <>
      {/* Slide-down top banner */}
      {showBanner && !justSimulatedInstalled && (
        <div 
          id="pwa-install-banner"
          className="fixed top-0 left-0 right-0 z-[100] transform transition-all duration-500 ease-out animate-in slide-in-from-top duration-300"
        >
          <div className="bg-slate-900/95 border-b border-emerald-500/30 text-white shadow-2xl backdrop-blur-xl px-4 py-3 sm:px-6">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left side: Icon & Text */}
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
                    <img 
                      src="/yapp_logo.svg" 
                      alt="Yapp It Logo" 
                      className="w-10 h-10 object-contain drop-shadow"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-slate-700">
                    <Zap className="w-2.5 h-2.5 text-emerald-400" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Install Yapp It now
                    </h2>
                    <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Official PWA
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 sm:line-clamp-none">
                    Instant home screen launch, full offline mode &amp; encrypted calls.
                  </p>
                </div>
              </div>

              {/* Right side: Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                <button
                  type="button"
                  id="pwa-dismiss-btn"
                  onClick={dismissBanner}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Later
                </button>

                <button
                  type="button"
                  id="pwa-add-to-home-btn"
                  disabled={isInstalling}
                  onClick={handleAddToHome}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  {isInstalling ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Installing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Add to Home</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {(installSuccess || justSimulatedInstalled) && (
        <div 
          id="pwa-install-success-toast"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top duration-300"
        >
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>Yapp It successfully added to your Home Screen!</span>
        </div>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div 
          id="pwa-ios-guide-modal"
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
              </div>
              <button 
                onClick={() => setShowIOSGuide(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Follow these two quick steps in Safari to install Yapp It directly to your home screen:
            </p>

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tap the <strong className="text-white inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-indigo-400 inline" /> Share</strong> button in Safari toolbar (at the bottom or top).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Scroll down the share sheet and tap <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Manual / Browser Guide Modal */}
      {showManualGuide && (
        <div 
          id="pwa-manual-guide-modal"
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Install Yapp It</h3>
              </div>
              <button 
                onClick={() => setShowManualGuide(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              In your browser:
            </p>

            <div className="space-y-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <p>• Click the <strong>Install</strong> icon in the address bar (on Desktop Chrome/Edge), or</p>
              <p>• Open browser menu <span className="font-mono text-slate-400">(⋮ or ⋯)</span> and choose <strong>"Install Yapp It"</strong> or <strong>"Add to Home screen"</strong>.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowManualGuide(false);
                setJustSimulatedInstalled(true);
                setTimeout(() => setJustSimulatedInstalled(false), 4000);
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md"
            >
              Confirm Installation
            </button>
          </div>
        </div>
      )}
    </>
  );
};
