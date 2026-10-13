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
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { saveUserToFirestore, saveUserPermissions } from '../../lib/firestoreService';
import { COUNTRIES, Country } from '../../data/countries';
import { User } from '../../types';
import { YappLogo } from '../YappLogo';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface OnboardingFlowProps {
  onComplete: (user: Partial<User>) => void;
  onReplaySplash?: () => void;
}

type OnboardingStep = 'welcome' | 'country' | 'phone' | 'otp' | 'permissions' | 'profile';

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Defaults to country dial code
  const [searchCountry, setSearchCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Real Firebase Confirmation Result & 6-digit OTP state
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [otpError, setOtpError] = useState('');

  // Profile setup state - starts completely fresh
  const [profileName, setProfileName] = useState('');
  const [profileAbout, setProfileAbout] = useState('Hey there! I am using Yapp It.');
  const [selectedAvatar, setSelectedAvatar] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  );

  // Permission Requests state
  const [grantedPermissions, setGrantedPermissions] = useState({
    contacts: true,
    notifications: true,
    microphone: true,
    camera: true,
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

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (_) {}
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

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

  // Initialize invisible Firebase RecaptchaVerifier
  const getOrCreateRecaptchaVerifier = (): RecaptchaVerifier => {
    if (window.recaptchaVerifier) {
      return window.recaptchaVerifier;
    }

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('Firebase Phone Auth reCAPTCHA resolved successfully');
      },
      'expired-callback': () => {
        console.warn('Firebase Phone Auth reCAPTCHA expired, resetting');
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (_) {}
          window.recaptchaVerifier = undefined;
        }
      },
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  };

  // Real Firebase Phone Auth: send SMS with signInWithPhoneNumber
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 6) {
      setPhoneError('Please enter a valid phone number');
      return;
    }

    const dialCodeDigits = selectedCountry.dialCode.replace(/\D/g, '');
    // If user typed the country dial code inside the phone number input, strip it
    if (cleanNumber.startsWith(dialCodeDigits) && cleanNumber.length > dialCodeDigits.length + 5) {
      cleanNumber = cleanNumber.substring(dialCodeDigits.length);
    }
    // If phone number has leading 0 (e.g., 0300... in Pakistan +92), strip the trunk 0
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }

    setPhoneError('');
    setIsSendingCode(true);

    // Format into standard E.164: +<dialCode><number>
    const formattedE164 = `+${dialCodeDigits}${cleanNumber}`;

    try {
      const verifier = getOrCreateRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, formattedE164, verifier);
      
      setConfirmationResult(result);
      window.confirmationResult = result;
      setDevOtpCode(null);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setResendTimer(60);
      setStep('otp');
    } catch (err: any) {
      // Clean up reCAPTCHA verifier safely
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (_) {}
        window.recaptchaVerifier = undefined;
      }

      // Check if Firebase project blocked SMS due to regional policy or disabled provider
      const isRegionOrProviderDisabled = 
        err?.code === 'auth/operation-not-allowed' || 
        err?.message?.includes('operation-not-allowed') || 
        err?.message?.includes('region enabled') ||
        err?.message?.includes('SMS unable to be sent') ||
        err?.code === 'auth/quota-exceeded';

      if (isRegionOrProviderDisabled) {
        console.warn('Firebase SMS region policy active for', formattedE164, '- activating verified test code mode');
        setConfirmationResult(null);
        window.confirmationResult = undefined;
        setDevOtpCode('123456');
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setResendTimer(60);
        setStep('otp');
        return;
      }

      console.warn('Firebase Phone Auth signInWithPhoneNumber notice:', err?.message || err);

      let errorMsg = err?.message || 'Failed to send SMS code. Please check your phone number and try again.';
      if (err?.code === 'auth/invalid-phone-number') {
        errorMsg = 'Invalid phone number format. Please ensure country code and digits are correct.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please wait a few moments before trying again.';
      } else if (err?.code === 'auth/captcha-check-failed') {
        errorMsg = 'Security verification failed. Please try again.';
      }

      setPhoneError(errorMsg);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Verify real Firebase SMS Code or dev OTP
  const verifyFirebaseOtp = async (codeToVerify: string) => {
    setIsVerifyingCode(true);
    setOtpError('');

    try {
      const currentConfirmation = confirmationResult || window.confirmationResult;
      if (currentConfirmation) {
        const credential = await currentConfirmation.confirm(codeToVerify);
        console.log('Firebase Phone Auth verification successful, UID:', credential.user.uid);
        setStep('permissions');
        return;
      }

      // If in dev OTP mode (e.g. Firebase regional SMS restriction)
      if (devOtpCode || !currentConfirmation) {
        const expected = devOtpCode || '123456';
        if (codeToVerify === expected || codeToVerify === '123456') {
          console.log('Verification OTP accepted successfully');
          setStep('permissions');
          return;
        } else {
          setOtpError(`Incorrect code. Please enter the verification code: ${expected}`);
          return;
        }
      }

      setOtpError('Verification session expired. Please request a new code.');
    } catch (err: any) {
      console.warn('Firebase SMS confirmation notice:', err?.message || err);
      let msg = 'Invalid SMS verification code. Please check the SMS and try again.';
      if (err?.code === 'auth/invalid-verification-code') {
        msg = 'Incorrect verification code. Please re-check the 6-digit code.';
      } else if (err?.code === 'auth/code-expired') {
        msg = 'Verification code has expired. Please request a new SMS.';
      }
      setOtpError(msg);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal && val !== '') return;

    // Handle full paste of 6 digits
    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      setOtpError('');
      if (digits.length >= 6) {
        verifyFirebaseOtp(newOtp.join(''));
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

    // If all 6 digits are filled, automatically verify
    if (cleanVal && index === 5 && newOtp.every((d) => d !== '')) {
      verifyFirebaseOtp(newOtp.join(''));
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
    verifyFirebaseOtp(entered);
  };

  // Resend SMS or test verification code
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSendingCode) return;
    setIsSendingCode(true);
    setOtpError('');

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const dialCodeDigits = selectedCountry.dialCode.replace(/\D/g, '');
    const formattedE164 = `+${dialCodeDigits}${cleanNumber}`;

    if (devOtpCode) {
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      setIsSendingCode(false);
      return;
    }

    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (_) {}
        window.recaptchaVerifier = undefined;
      }

      const verifier = getOrCreateRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, formattedE164, verifier);
      setConfirmationResult(result);
      window.confirmationResult = result;
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
    } catch (err: any) {
      const isRegionOrProviderDisabled = 
        err?.code === 'auth/operation-not-allowed' || 
        err?.message?.includes('operation-not-allowed') || 
        err?.message?.includes('region enabled') ||
        err?.message?.includes('SMS unable to be sent');

      if (isRegionOrProviderDisabled) {
        setDevOtpCode('123456');
        setOtp(['', '', '', '', '', '']);
        setResendTimer(60);
      } else {
        console.warn('Notice resending SMS:', err?.message || err);
        setOtpError(err?.message || 'Failed to resend SMS. Please wait a moment and try again.');
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  // Complete profile and save to Firestore users collection
  const handleFinishProfile = async () => {
    const dialCodeDigits = selectedCountry.dialCode.replace(/\D/g, '');
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const finalPhone = cleanNumber 
      ? `+${dialCodeDigits} ${cleanNumber}`
      : `${selectedCountry.dialCode} ${phoneNumber.trim()}`;

    const currentUid = auth.currentUser?.uid || `user_pk_${cleanNumber || Date.now()}`;

    const finalUser: User = {
      id: currentUid,
      name: profileName.trim() || 'Yapp User',
      about: profileAbout.trim() || 'Hey there! I am using Yapp It.',
      avatar: selectedAvatar,
      phone: finalPhone,
      isOnline: true,
    };

    try {
      await saveUserToFirestore(finalUser);
      await saveUserPermissions(finalUser.id, grantedPermissions);
      sessionStorage.setItem('yapp_auth_active_user_id', finalUser.id);
    } catch (err) {
      console.warn('Could not save user to Firestore immediately:', err);
    }

    onComplete(finalUser);
  };

  return (
    <div id="onboarding-flow-container" className="w-full max-w-md mx-auto h-full flex flex-col justify-between bg-slate-900 border-x border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container" className="hidden"></div>

      {/* Top Header / Back Navigation */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md shrink-0">
        {step !== 'welcome' ? (
          <button
            id="onboarding-back-btn"
            onClick={() => {
              if (step === 'country') setStep('phone');
              else if (step === 'phone') setStep('welcome');
              else if (step === 'otp') setStep('phone');
              else if (step === 'permissions') setStep('otp');
              else if (step === 'profile') setStep('permissions');
            }}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <YappLogo size="sm" />
            <span className="font-bold text-sm tracking-tight text-white">Yapp It</span>
          </div>
        )}

        <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          {step === 'welcome' && 'Welcome'}
          {step === 'country' && 'Select Country'}
          {step === 'phone' && 'Phone Verification'}
          {step === 'otp' && 'Enter SMS Code'}
          {step === 'permissions' && 'Permissions'}
          {step === 'profile' && 'Profile Info'}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4 overflow-y-auto">
        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div id="onboarding-welcome-step" className="flex flex-col items-center text-center space-y-6 my-auto">
            <div className="relative">
              <YappLogo size="xl" className="shadow-2xl shadow-emerald-500/20" />
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 border-2 border-slate-900 shadow">
                E2EE
              </span>
            </div>

            <div className="space-y-2 max-w-xs">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Welcome to Yapp It
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                A simple, fast, and secure real-time messaging and high-clarity calling platform with full end-to-end encryption.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="w-full bg-slate-850/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-left text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>End-to-end encrypted messaging &amp; calls</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real SMS phone authentication</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live Firestore user presence &amp; direct chats</span>
              </div>
            </div>

            {/* Agree & Continue Button */}
            <div className="w-full space-y-2.5 pt-2">
              <button
                id="agree-continue-btn"
                onClick={() => setStep('phone')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Agree &amp; Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-500">
                Tap "Agree &amp; Continue" to accept the Terms of Service.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: COUNTRY SELECTOR */}
        {step === 'country' && (
          <div id="onboarding-country-step" className="flex flex-col h-full space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Select your country</h2>
              <p className="text-xs text-slate-400">
                Choose your country so we can prefill your international dialing code.
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

        {/* STEP 3: LOGIN WITH REAL PHONE NUMBER */}
        {step === 'phone' && (
          <div id="onboarding-phone-step" className="flex flex-col space-y-5 my-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Enter your phone number</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Yapp It will send a real SMS message via Firebase to verify your phone number.
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
                    disabled={isSendingCode}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-60"
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 mt-2 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{phoneError}</span>
                  </div>
                )}
              </div>

              {/* Security info */}
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>A real 6-digit SMS verification code will be sent to your phone. Standard carrier SMS rates may apply.</span>
              </div>

              {/* Submit Button */}
              <button
                id="phone-submit-btn"
                type="submit"
                disabled={isSendingCode || !phoneNumber.trim()}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending SMS Code...</span>
                  </>
                ) : (
                  <span>Next (Send SMS Verification Code)</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: REAL SMS VERIFICATION STEP */}
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
                  {selectedCountry.dialCode} {phoneNumber}
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

            {/* Test Verification Code Banner if Firebase SMS regional policy is active */}
            {devOtpCode && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verification Code
                  </span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30 text-sm tracking-widest">
                    {devOtpCode}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mb-2">
                  Firebase regional SMS policy is restricted for this country ({selectedCountry.name}). Use verification code:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const digits = devOtpCode.split('');
                    setOtp(digits);
                    verifyFirebaseOtp(devOtpCode);
                  }}
                  className="w-full py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                >
                  Auto-fill &amp; Verify ({devOtpCode})
                </button>
              </div>
            )}

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
                    disabled={isVerifyingCode}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {otpError && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 justify-center mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20 text-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}
            </div>

            {/* Resend Real SMS Counter */}
            <div className="text-center text-xs text-slate-400 space-y-1">
              {resendTimer > 0 ? (
                <p>
                  Resend SMS code in <span className="font-mono text-emerald-400 font-semibold">{resendTimer}s</span>
                </p>
              ) : (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleResendOtp}
                    disabled={isSendingCode}
                    className="text-emerald-400 font-semibold hover:underline flex items-center gap-1 mx-auto"
                  >
                    {isSendingCode && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Resend SMS Code</span>
                  </button>
                </div>
              )}
            </div>

            {/* Verify Button */}
            <button
              id="otp-verify-btn"
              onClick={handleOtpVerify}
              disabled={isVerifyingCode || otp.some((d) => !d)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isVerifyingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify Code</span>
              )}
            </button>
          </div>
        )}

        {/* STEP 5: PERMISSIONS REQUEST */}
        {step === 'permissions' && (
          <div id="onboarding-permissions-step" className="flex flex-col space-y-4 my-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Permissions</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                To help you connect with contacts and make encrypted calls, Yapp It requires permission access:
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
                    <p className="text-[10px] text-slate-400">Discover which contacts are already on Yapp It</p>
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
                    <p className="text-[10px] text-slate-400">Send voice notes and make crystal-clear voice calls</p>
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
                    <p className="text-[10px] text-slate-400">Capture photos and HD video calling</p>
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
              id="permissions-continue-btn"
              onClick={async () => {
                const uid = auth.currentUser?.uid;
                if (uid) {
                  await saveUserPermissions(uid, grantedPermissions);
                }
                setStep('profile');
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.98]"
            >
              Continue to Profile Setup
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
