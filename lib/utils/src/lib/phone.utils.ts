import { COUNTRIES } from './country.utils';

/**
 * Phone number formatting and validation utilities
 */

/**
 * Get phone format placeholder based on country code
 */
function getPhoneFormatExample(format: string, sampleDigits: string): string {
  let index = 0;
  return format.replace(/0/g, () => sampleDigits[index++ % sampleDigits.length]);
}

export function getPhoneFormatPlaceholder(countryCode: string): string {
  const country = COUNTRIES.find((item) => item.value === countryCode);
  if (!country || !country.phoneFormat) {
    return 'Enter phone number';
  }

  const sampleDigits = countryCode === 'PH'
    ? '09957586652'
    : '9876543210';

  return getPhoneFormatExample(country.phoneFormat, sampleDigits);
}

/**
 * Get phone error message based on form control errors
 */
export function getPhoneErrorMessage(errors: unknown): string {
  if (typeof errors === 'object' && errors !== null) {
    const typedErrors = errors as Record<string, unknown>;
    if (typedErrors['required']) {
      return 'Phone number is required';
    }
    if (typedErrors['pattern']) {
      return 'Please enter a valid phone number';
    }
  }
  return 'Invalid phone number';
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  // Basic phone validation pattern
  const phonePattern = /^\+?[\d\s\-()]+$/;
  return phonePattern.test(phoneNumber);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  switch (countryCode) {
    case 'US':
    case 'CA':
      // Format as (XXX) XXX-XXXX
      if (cleaned.length >= 10) {
        const digits = cleaned.replace(/^\+?1?/, '');
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      }
      break;
    case 'PH':
      // Format as XXX XXX XXXX
      if (cleaned.length >= 10) {
        const digits = cleaned.replace(/^\+?63?/, '');
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
      }
      break;
    default:
      return phoneNumber;
  }
  
  return phoneNumber;
}

/**
 * Get country code from phone number
 */
export function getCountryCodeFromPhone(phoneNumber: string): string | null {
  if (!phoneNumber.startsWith('+')) return null;
  
  const phoneCodeMap: { [key: string]: string } = {
    '+1': 'US',
    '+44': 'GB',
    '+49': 'DE',
    '+33': 'FR',
    '+34': 'ES',
    '+39': 'IT',
    '+63': 'PH',
    '+81': 'JP',
    '+86': 'CN',
    '+91': 'IN',
    '+61': 'AU',
    '+55': 'BR',
    '+52': 'MX',
    '+31': 'NL',
    '+46': 'SE',
    '+47': 'NO',
    '+45': 'DK',
    '+358': 'FI',
    '+65': 'SG',
    '+82': 'KR',
  };

  // Check for longest matches first
  for (const phoneCode of Object.keys(phoneCodeMap).sort((a, b) => b.length - a.length)) {
    if (phoneNumber.startsWith(phoneCode)) {
      return phoneCodeMap[phoneCode];
    }
  }

  return null;
}