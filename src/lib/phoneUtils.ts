/**
 * Phone number normalization and matching utilities
 */

export function normalizePhoneNumber(input: string): string {
  if (!input) return '';
  // Remove all non-digits except a leading +
  const cleaned = input.trim();
  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function extractDigits(input: string): string {
  if (!input) return '';
  return input.replace(/\D/g, '');
}

/**
 * Checks if two phone numbers match, accounting for country codes or national prefixes (0/91/1/92, etc.)
 */
export function matchPhoneNumbers(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const digitsA = extractDigits(phoneA);
  const digitsB = extractDigits(phoneB);

  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;

  // Check last 10 digits (standard mobile number length in most regions)
  const last10A = digitsA.slice(-10);
  const last10B = digitsB.slice(-10);
  if (last10A.length === 10 && last10B.length === 10 && last10A === last10B) {
    return true;
  }

  // Check last 9 digits (for regions with 9-digit local numbers)
  const last9A = digitsA.slice(-9);
  const last9B = digitsB.slice(-9);
  if (last9A.length >= 8 && last9A === last9B) {
    return true;
  }

  return false;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = extractDigits(phone);
  if (phone.startsWith('+')) {
    return phone;
  }
  if (digits.length === 10) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}
