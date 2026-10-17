/**
 * ============================================================================
 * ENGINE 1: AUTHENTICATION SYSTEM (The Phone OTP & reCAPTCHA Fix)
 * ============================================================================
 * 
 * Production-ready Firebase Phone Authentication engine for "Yapp It".
 * Configured for Vite/Bun/Vercel deployments.
 * 
 * Features:
 * - Invisible reCAPTCHA initialization bound to '#recaptcha-container'.
 * - Safe lifecycle management (prevents DOM collisions, leaks, and stale widget IDs).
 * - Full E.164 phone formatting and validation.
 * - sendOtp(phoneNumber) and verifyOtp(otpCode) service functions.
 * - Comprehensive typed error mapping (e.g. auth/unauthorized-domain for Vercel).
 * - Strict TypeScript: No 'any' types used.
 */

import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

// ---------------------------------------------------------------------------
// TypeScript Global Window Extension
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
    confirmationResult?: ConfirmationResult;
  }
}

export interface AuthStateResponse {
  success: boolean;
  message: string;
  user?: UserCredential['user'];
  error?: string;
}

/**
 * Standard E.164 format regex:
 * Starts with '+', followed by 1-3 digits country code, total 8-15 digits.
 */
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Standardize user-typed numbers into international E.164 format.
 * Defaults to Pakistan (+92) if dial code is missing.
 */
export function formatPhoneNumberToE164(rawPhone: string, fallbackCountryCode = '+92'): string {
  const trimmed = rawPhone.trim();
  if (trimmed.startsWith('+')) {
    return trimmed.replace(/[^\d+]/g, '');
  }

  // Remove all non-digits
  let digitsOnly = trimmed.replace(/\D/g, '');

  // Strip leading national trunk '0' (e.g. 0300... -> 300...)
  if (digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.substring(1);
  }

  const dialDigits = fallbackCountryCode.replace(/\D/g, '');
  if (digitsOnly.startsWith(dialDigits)) {
    return `+${digitsOnly}`;
  }

  return `${fallbackCountryCode}${digitsOnly}`;
}

/**
 * Safely initialize or retrieve the invisible Firebase RecaptchaVerifier.
 * Explicitly guards against missing DOM nodes and multiple instantiations.
 */
export function getOrCreateRecaptchaVerifier(
  containerId = 'recaptcha-container'
): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('[AuthEngine] Window is undefined. RecaptchaVerifier requires browser environment.');
  }

  // Return existing verifier if already initialized
  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  // Ensure mount point exists in DOM
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA verification passed automatically
    },
    'expired-callback': () => {
      resetRecaptchaVerifier();
    },
  });

  window.recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Destroy and reset the reCAPTCHA instance.
 * Call this on failure or when retrying phone submission to prevent stale tokens.
 */
export function resetRecaptchaVerifier(): void {
  if (typeof window === 'undefined') return;

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // Ignored if already cleaned
    }
    window.recaptchaVerifier = undefined;
    window.recaptchaWidgetId = undefined;
  }

  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Maps known Firebase Auth error codes to user-friendly and actionable error messages.
 */
function parseAuthErrorMessage(error: unknown): string {
  const authErr = error as Partial<AuthError>;
  switch (authErr.code) {
    case 'auth/unauthorized-domain':
      return 'Deployment domain unauthorized. In Firebase Console -> Authentication -> Settings -> Authorized Domains, add your Vercel URL.';
    case 'auth/invalid-phone-number':
      return 'The phone number format is invalid. Ensure you included a valid country code (e.g. +92 for Pakistan).';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for this Firebase project. Try again later or configure Firebase SMS test numbers.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before requesting another verification code.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA challenge failed. Please check your internet connection and retry.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in or this country region is disabled in Firebase Console. Enable Phone Auth and SMS regions under Authentication Settings.';
    case 'auth/invalid-verification-code':
      return 'Invalid 6-digit OTP code. Please check your SMS and re-enter.';
    case 'auth/code-expired':
      return 'Verification code has expired. Please tap "Resend Code".';
    default:
      return authErr.message || 'An unexpected authentication error occurred.';
  }
}

/**
 * Engine Function: Send SMS OTP to an international phone number.
 * 
 * @param phoneNumber Formatted or raw international phone number (e.g. '+923001234567')
 * @param containerId DOM container ID for invisible reCAPTCHA (default: 'recaptcha-container')
 */
export async function sendOtp(
  phoneNumber: string,
  containerId = 'recaptcha-container'
): Promise<ConfirmationResult> {
  const formattedPhone = formatPhoneNumberToE164(phoneNumber);

  if (!E164_REGEX.test(formattedPhone)) {
    throw new Error(
      `Invalid international phone number: "${phoneNumber}". Must conform to E.164 (e.g., +923001234567).`
    );
  }

  try {
    const verifier = getOrCreateRecaptchaVerifier(containerId);

    // Warm up the widget ID to verify DOM registration
    if (typeof window.recaptchaWidgetId === 'undefined') {
      window.recaptchaWidgetId = await verifier.render();
    }

    const firebaseAuth = getAuth();
    const confirmationResult = await signInWithPhoneNumber(
      firebaseAuth,
      formattedPhone,
      verifier
    );

    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error: unknown) {
    // Reset verifier on error so subsequent attempts start fresh
    resetRecaptchaVerifier();
    const friendlyMessage = parseAuthErrorMessage(error);
    throw new Error(friendlyMessage);
  }
}

/**
 * Engine Function: Confirm OTP entered by the user.
 * 
 * @param otpCode 6-digit SMS verification code
 * @param confirmationResult Optional confirmation instance (defaults to window.confirmationResult)
 */
export async function verifyOtp(
  otpCode: string,
  confirmationResult?: ConfirmationResult
): Promise<UserCredential> {
  const activeConfirmation = confirmationResult || window.confirmationResult;

  if (!activeConfirmation) {
    throw new Error('No active verification session found. Please request a new verification code.');
  }

  const sanitizedCode = otpCode.trim();
  if (sanitizedCode.length !== 6 || !/^\d{6}$/.test(sanitizedCode)) {
    throw new Error('Verification code must be exactly 6 numeric digits.');
  }

  try {
    const credential = await activeConfirmation.confirm(sanitizedCode);

    // Clean up reCAPTCHA resources after successful authentication
    resetRecaptchaVerifier();
    window.confirmationResult = undefined;

    return credential;
  } catch (error: unknown) {
    const friendlyMessage = parseAuthErrorMessage(error);
    throw new Error(friendlyMessage);
  }
}
