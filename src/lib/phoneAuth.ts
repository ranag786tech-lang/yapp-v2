import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult, 
  UserCredential 
} from 'firebase/auth';
import { auth } from './firebase';

// 1. TypeScript Interface Extension for the Global Window Object
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
    confirmationResult?: ConfirmationResult;
  }
}

/**
 * Safely initialize or retrieve the invisible Firebase RecaptchaVerifier.
 * Tied to the DOM element with ID `containerId` (default: 'recaptcha-container').
 */
export const initRecaptchaVerifier = (
  containerId: string = 'recaptcha-container'
): RecaptchaVerifier => {
  // Return existing verifier if active and intact
  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  // Ensure DOM container exists
  let container = document.getElementById(containerId);
  if (!container) {
    // Gracefully mount container to document body if missing
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  // Create new RecaptchaVerifier instance
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: (_response: string) => {
      // reCAPTCHA solved - allow signInWithPhoneNumber
      console.log('[PhoneAuth] reCAPTCHA verified successfully');
    },
    'expired-callback': () => {
      console.warn('[PhoneAuth] reCAPTCHA expired, resetting verifier');
      clearRecaptchaVerifier();
    },
  });

  window.recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Clean up existing RecaptchaVerifier instance safely to avoid stale tokens
 * or duplicate widget errors during retries.
 */
export const clearRecaptchaVerifier = (): void => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.warn('[PhoneAuth] Warning while clearing recaptchaVerifier:', e);
    }
    window.recaptchaVerifier = undefined;
    window.recaptchaWidgetId = undefined;
  }

  // Clear inner content in container to prevent duplicate grecaptcha iframe bindings
  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.innerHTML = '';
  }
};

/**
 * Format phone number into E.164 standard (e.g. +923001234567)
 */
export const formatToE164 = (rawPhone: string, defaultDialCode: string = '+92'): string => {
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    const dialDigits = defaultDialCode.replace(/\D/g, '');
    if (cleaned.startsWith(dialDigits)) {
      cleaned = `+${cleaned}`;
    } else {
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      cleaned = `${defaultDialCode}${cleaned}`;
    }
  }
  return cleaned;
};

/**
 * Send SMS OTP using Firebase Phone Authentication.
 * Accepts an international format phone number (e.g., +923xxxxxxxxx).
 */
export const sendOtp = async (
  phoneNumber: string,
  containerId: string = 'recaptcha-container'
): Promise<ConfirmationResult> => {
  // Validate basic E.164 phone pattern
  const e164Pattern = /^\+[1-9]\d{7,14}$/;
  if (!e164Pattern.test(phoneNumber)) {
    throw new Error(
      `Invalid international phone number format: "${phoneNumber}". Must match E.164 format (e.g. +923001234567).`
    );
  }

  try {
    const verifier = initRecaptchaVerifier(containerId);
    
    // Explicitly trigger render so widget is mounted and ready
    if (typeof window.recaptchaWidgetId === 'undefined') {
      window.recaptchaWidgetId = await verifier.render();
    }

    const firebaseAuth = getAuth();
    const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);

    // Save globally and return for verification
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error: any) {
    console.error('[PhoneAuth] signInWithPhoneNumber failed:', error);
    
    // Reset verifier so subsequent attempts don't inherit a corrupted widget state
    clearRecaptchaVerifier();

    // Map common Firebase errors to actionable guidance
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error(
        'This domain is not authorized in Firebase Console. Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add your Vercel deployment domain (e.g., your-app.vercel.app).'
      );
    } else if (error?.code === 'auth/invalid-phone-number') {
      throw new Error('The phone number is invalid. Please verify country code and mobile digits.');
    } else if (error?.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded for this Firebase project. Please try again later or add test phone numbers.');
    } else if (error?.code === 'auth/too-many-requests') {
      throw new Error('Too many requests have been sent. Please wait a few minutes before requesting another code.');
    } else if (error?.code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA verification failed. Please check network connection and try again.');
    } else if (error?.code === 'auth/operation-not-allowed') {
      throw new Error('Phone sign-in is disabled or this country region is not enabled in Firebase Console.');
    }

    throw error;
  }
};

/**
 * Confirm OTP entered by user using the ConfirmationResult
 */
export const confirmOtp = async (
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<UserCredential> => {
  if (!otpCode || otpCode.trim().length !== 6) {
    throw new Error('Please enter a valid 6-digit verification code.');
  }

  try {
    const credential = await confirmationResult.confirm(otpCode.trim());
    
    // Clean up verifier upon successful authentication
    clearRecaptchaVerifier();
    window.confirmationResult = undefined;
    
    return credential;
  } catch (error: any) {
    console.error('[PhoneAuth] confirmOtp failed:', error);
    if (error?.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid verification code. Please check and try again.');
    } else if (error?.code === 'auth/code-expired') {
      throw new Error('Verification code has expired. Please request a new code.');
    }
    throw error;
  }
};
