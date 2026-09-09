import { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  Search, 
  ArrowLeft, 
  Phone, 
  ShieldCheck, 
  Check, 
  User as UserIcon, 
  Lock,
  Camera,
  Mic,
  Users,
  Bell,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { COUNTRIES, Country } from '../../data/countries';
import { User } from '../../types';
import { YappLogo } from '../YappLogo';

interface OnboardingFlowProps {
  onComplete: (user: Partial<User>) => void;
  onReplaySplash?: () => void;
}

type OnboardingStep = 'welcome' | 'country' | 'phone' | 'otp' | 'permissions' | 'profile';

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default to +91 or +1
  const [searchCountry, setSearchCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Dynamic OTP state
  const [activeCode, setActiveCode] = useState('849201');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [showSmsBanner, setShowSmsBanner] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Profile setup state
  const [profileName, setProfileName] = useState('Rana G');
  const [profileAbout, setProfileAbout] = useState('Hey there! I am using Yapp It.');
  const [selectedAvatar, setSelectedAvatar] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  );

  // Natural Permission Requests state
  const [grantedPermissions, setGrantedPermissions] = useState({
    contacts: true,
    notifications: true,
    microphone: true,
    camera: false,
  });

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  ];

  // Resend Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
      c.dialCode.includes(searchCountry) ||
      c.code.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setStep('phone');
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 6) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setPhoneError('');

    // Generate real dynamic 6-digit code
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveCode(generated);
    setOtp(['', '', '', '', '', '']);
    setResendTimer(30);
    setStep('otp');

    // Trigger realistic incoming SMS notification after 1 second
    setTimeout(() => {
      setShowSmsBanner(true);
    }, 800);
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal && val !== '') return;

    // Handle full paste
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      setOtpError('');
      if (digits.length >= 6) {
        setTimeout(() => setStep('permissions'), 300);
      } else {
        otpInputsRef.current[Math.min(digits.length, 5)]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);
    setOtpError('');

    // Auto-advance to next box
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // If all 6 digits are now filled, verify immediately
    if (cleanVal && index === 5 && newOtp.every((d) => d !== '')) {
      setTimeout(() => {
        setStep('permissions');
      }, 300);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = () => {
    const entered = otp.join('');
    if (entered.length < 6) {
      setOtpError('Please enter the full 6-digit verification code');
      return;
    }
    setStep('permissions');
  };

  const handleAutoFillFromSms = () => {
    const digits = activeCode.split('');
    setOtp(digits);
    setShowSmsBanner(false);
    setTimeout(() => {
      setStep('permissions');
    }, 400);
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
    setActiveCode(freshCode);
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    setShowSmsBanner(true);
  };

  const handleFinishProfile = () => {
    onComplete({
      name: profileName.trim() || 'Yapp User',
      about: profileAbout.trim(),
      avatar: selectedAvatar,
      phone: `${selectedCountry.dialCode} ${phoneNumber.trim() || '98765 43210'}`,
    });
  };

  return (
    <div id="onboarding-flow-container" className="w-full max-w-md mx-auto h-full flex flex-col justify-between bg-slate-900 border-x border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Incoming SMS Notification Toast for Realism */}
      {showSmsBanner && step === 'otp' && (
        <div 
          onClick={handleAutoFillFromSms}
          className="absolute top-3 left-3 right-3 z-50 bg-slate-800/95 border border-emerald-500/50 shadow-2xl rounded-2xl p-3 backdrop-blur-md cursor-pointer animate-in fade-in slide-in-from-top-4 duration-300 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow font-bold text-xs">
            💬
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-white">Messages</span>
              <span>now</span>
            </div>
            <p className="text-xs text-slate-200 mt-0.5">
              Your Yapp It security code is: <strong className="text-emerald-400 font-mono tracking-wider text-sm">{activeCode.slice(0, 3)}-{activeCode.slice(3)}</strong>
            </p>
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-400">
              Tap to auto-insert code →
            </span>
          </div>
        </div>
      )}

      {/* Top Header / Clean Title Bar */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between z-10 shrink-0 bg-slate-900">
        {step !== 'welcome' ? (
          <button
            onClick={() => {
              if (step === 'country') setStep('welcome');
              else if (step === 'phone') setStep('country');
              else if (step === 'otp') setStep('phone');
              else if (step === 'permissions') setStep('otp');
              else if (step === 'profile') setStep('permissions');
            }}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-6" />
        )}

        <div className="flex items-center gap-2">
          <YappLogo size={24} />
          <span className="text-sm font-bold tracking-tight text-white">Yapp It</span>
        </div>

        {/* Clean step indicator */}
        <div className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
          {step === 'welcome' && '1/5'}
          {step === 'country' && '2/5'}
          {step === 'phone' && '3/5'}
          {step === 'otp' && '4/5'}
          {step === 'permissions' && '5/5'}
          {step === 'profile' && 'Setup'}
        </div>
      </div>

      {/* Main Flow Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div id="onboarding-welcome-step" className="flex flex-col items-center text-center my-auto space-y-6">
            <div className="relative mb-2">
              <YappLogo size={110} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                Welcome to Yapp It
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                Simple, reliable, and private messaging and video calling for friends and family worldwide.
              </p>
            </div>

            {/* Privacy note */}
            <div className="p-3.5 bg-slate-850 rounded-2xl border border-slate-800 text-xs text-slate-400 leading-normal flex items-start gap-2.5 text-left max-w-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Tap "Agree and continue" to accept the{' '}
                <span className="text-emerald-400 underline cursor-pointer">Terms of Service</span> and acknowledge our{' '}
                <span className="text-emerald-400 underline cursor-pointer">Privacy Policy</span>.
              </span>
            </div>

            {/* Action */}
            <div className="w-full pt-4">
              <button
                id="welcome-agree-btn"
                onClick={() => setStep('country')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Agree and continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COUNTRY SELECTION SCREEN */}
        {step === 'country' && (
          <div id="onboarding-country-step" className="flex flex-col h-full space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Select your country</h2>
              <p className="text-xs text-slate-400">
                Choose your country so we can prefill your country dialing code.
              </p>
            </div>

            {/* Search Country Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="country-search-input"
                type="text"
                placeholder="Search country name or code..."
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
                autoFocus
              />
            </div>

            {/* Country List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-850/60 max-h-[380px]">
              {filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <div
                    key={country.code}
                    id={`country-item-${country.code}`}
                    onClick={() => handleCountrySelect(country)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-500/20 text-white' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-sm font-medium">{country.name}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      {country.dialCode}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-500">
                Selected: <span className="text-slate-300 font-semibold">{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.dialCode})</span>
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: LOGIN WITH PHONE NUMBER */}
        {step === 'phone' && (
          <div id="onboarding-phone-step" className="flex flex-col space-y-5 my-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Enter your phone number</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Yapp It will send an SMS message to verify your phone number.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              {/* Country Picker Row */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Country / Region
                </label>
                <div
                  id="selected-country-btn"
                  onClick={() => setStep('country')}
                  className="w-full bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span className="text-sm font-medium text-white">{selectedCountry.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    Change <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Phone Input Row */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  {/* Dial code box */}
                  <div className="w-20 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-center font-mono font-bold text-sm text-emerald-400 flex items-center justify-center shrink-0">
                    {selectedCountry.dialCode}
                  </div>
                  {/* Number input */}
                  <input
                    id="phone-number-input"
                    type="tel"
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-400 mt-1.5">{phoneError}</p>
                )}
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Carrier SMS rates may apply. Protected with end-to-end encryption.</span>
              </div>

              {/* Submit */}
              <button
                id="phone-submit-btn"
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
              >
                Next (Request Verification Code)
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: SMS VERIFICATION STEP */}
        {step === 'otp' && (
          <div id="onboarding-otp-step" className="flex flex-col space-y-5 my-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Verifying your number</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Enter the 6-digit code sent via SMS to{' '}
                <span className="text-emerald-400 font-mono font-semibold">
                  {selectedCountry.dialCode} {phoneNumber || '98765 43210'}
                </span>
                .{' '}
                <button
                  onClick={() => setStep('phone')}
                  className="text-emerald-400 underline font-medium"
                >
                  Edit number
                </button>
              </p>
            </div>

            {/* 6-Digit OTP Inputs */}
            <div>
              <div className="flex justify-center gap-2 mb-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpInputsRef.current[i] = el; }}
                    id={`otp-input-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-emerald-500 transition-all"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {otpError && (
                <p className="text-xs text-red-400 text-center mt-1.5">{otpError}</p>
              )}
            </div>

            {/* Resend SMS Counter */}
            <div className="text-center text-xs text-slate-400 space-y-1">
              {resendTimer > 0 ? (
                <p>
                  Resend SMS in <span className="font-mono text-emerald-400 font-semibold">{resendTimer}s</span>
                </p>
              ) : (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleResendOtp}
                    className="text-emerald-400 font-semibold hover:underline"
                  >
                    Resend SMS
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={handleResendOtp}
                    className="text-emerald-400 font-semibold hover:underline"
                  >
                    Call Me
                  </button>
                </div>
              )}
            </div>

            {/* Verify Button */}
            <button
              id="otp-verify-btn"
              onClick={handleOtpVerify}
              disabled={otp.some((d) => !d)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.98]"
            >
              Verify Code
            </button>
          </div>
        )}

        {/* STEP 5: NATURAL PERMISSIONS REQUEST (Android & iOS standard) */}
        {step === 'permissions' && (
          <div id="onboarding-permissions-step" className="flex flex-col space-y-4 my-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Permissions</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                To help you connect with friends and make calls, Yapp It requires permission access:
              </p>
            </div>

            {/* Permission list */}
            <div className="space-y-2 bg-slate-850 p-3 rounded-2xl border border-slate-800">
              {/* Contacts */}
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Contacts</h4>
                    <p className="text-[10px] text-slate-400">Find which friends are already on Yapp It</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={grantedPermissions.contacts}
                  onChange={(e) => setGrantedPermissions({ ...grantedPermissions, contacts: e.target.checked })}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between p-2 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Notifications</h4>
                    <p className="text-[10px] text-slate-400">Receive alerts for incoming chats &amp; calls</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={grantedPermissions.notifications}
                  onChange={(e) => setGrantedPermissions({ ...grantedPermissions, notifications: e.target.checked })}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
              </div>

              {/* Microphone */}
              <div className="flex items-center justify-between p-2 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Microphone</h4>
                    <p className="text-[10px] text-slate-400">Send voice messages and make clear calls</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={grantedPermissions.microphone}
                  onChange={(e) => setGrantedPermissions({ ...grantedPermissions, microphone: e.target.checked })}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
              </div>

              {/* Camera */}
              <div className="flex items-center justify-between p-2 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Camera</h4>
                    <p className="text-[10px] text-slate-400">Take photos, record videos, and HD video calls</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={grantedPermissions.camera}
                  onChange={(e) => setGrantedPermissions({ ...grantedPermissions, camera: e.target.checked })}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
              </div>
            </div>

            <button
              onClick={() => setStep('profile')}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.98]"
            >
              Continue to Profile
            </button>
          </div>
        )}

        {/* STEP 6: PROFILE SETUP SCREEN */}
        {step === 'profile' && (
          <div id="onboarding-profile-step" className="flex flex-col space-y-5 my-auto">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">Profile info</h2>
              <p className="text-xs text-slate-400">
                Please provide your name and an optional profile photo.
              </p>
            </div>

            {/* Avatar Selection */}
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <img
                  src={selectedAvatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500 shadow-xl"
                />
                <span className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 rounded-full text-slate-950 ring-2 ring-slate-900 shadow">
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Preset choices */}
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Avatar ${i}`}
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-10 h-10 rounded-full object-cover cursor-pointer border-2 transition-transform hover:scale-105 ${
                      selectedAvatar === url ? 'border-emerald-400 scale-105' : 'border-slate-700 opacity-60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Input Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Your Name
              </label>
              <input
                id="profile-name-input"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Type your name here..."
                maxLength={30}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Input About */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                About
              </label>
              <input
                id="profile-about-input"
                type="text"
                value={profileAbout}
                onChange={(e) => setProfileAbout(e.target.value)}
                placeholder="Hey there! I am using Yapp It."
                maxLength={80}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Submit */}
            <button
              id="profile-finish-btn"
              onClick={handleFinishProfile}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Done &amp; Open Chats</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Privacy Branding */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-500 shrink-0 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>End-to-End Encrypted • Your privacy is our priority</span>
      </div>
    </div>
  );
};
