import { useEffect } from 'react';
import { YappLogo } from '../YappLogo';
import { ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  useEffect(() => {
    // Clean, quick, authentic WhatsApp-style opening
    const timer = setTimeout(() => {
      onFinish();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      id="splash-screen"
      onClick={onFinish}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 p-8 text-white select-none cursor-pointer"
    >
      {/* Top spacing */}
      <div className="h-10" />

      {/* Center: Just the official app logo and clean name */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="relative mb-5">
          <YappLogo size={96} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Yapp It
        </h1>
      </div>

      {/* Bottom: Clean encryption attribution (just like WhatsApp's "from Meta") */}
      <div className="flex flex-col items-center pb-6">
        <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1">
          from
        </span>
        <span className="text-xs font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          YAPP
        </span>
      </div>
    </div>
  );
};
