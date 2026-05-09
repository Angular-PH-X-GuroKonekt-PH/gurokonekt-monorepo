import { PHONE_COUNTRY_CODES } from '../constants/phone-country-codes.constants';

/**
 * Phone number formatter for international format conversion
 */

/** Get list of countries for dropdowns */
export function getCountriesList(): Array<{ code: string; name: string; dialCode: string }> {
  return Object.entries(PHONE_COUNTRY_CODES).map(([code, info]) => ({
    code,
    name: info.name,
    dialCode: info.dialCode,
  }));
}

/** Detect country from phone number dial code */
export function detectCountryFromPhone(phoneNumber: string): string {
  if (!phoneNumber) return 'PH'; // Default

  const cleanedPhone = phoneNumber.replace(/\D/g, '');
  
  // Try to match dial codes (search longest first to avoid conflicts)
  const sortedEntries = Object.entries(PHONE_COUNTRY_CODES).sort(
    (a, b) => b[1].dialCode.length - a[1].dialCode.length
  );

  for (const [code, info] of sortedEntries) {
    const dialCodeDigits = info.dialCode.replace('+', '');
    if (cleanedPhone.startsWith(dialCodeDigits)) {
      return code;
    }
  }

  return 'PH'; // Default
}

/**
 * Validate phone number length for specific country
 * @param phoneNumber - Phone number digits only
 * @param countryCode - Country code (e.g., 'PH', 'US')
 * @returns true if length is valid for the country
 */
export function isValidPhoneLengthForCountry(phoneNumber: string, countryCode = 'PH'): boolean {
  const country = PHONE_COUNTRY_CODES[countryCode as keyof typeof PHONE_COUNTRY_CODES];
  if (!country) return false;

  const cleaned = phoneNumber.replace(/\D/g, '');
  const dialCodeDigits = country.dialCode.replace('+', '');
  
  // Remove country code from the number to check actual phone length
  let numberWithoutCountryCode = cleaned;
  if (numberWithoutCountryCode.startsWith(dialCodeDigits)) {
    numberWithoutCountryCode = numberWithoutCountryCode.substring(dialCodeDigits.length);
  }

  const length = numberWithoutCountryCode.length;
  return length >= country.minLength && length <= country.maxLength;
}

/**
 * Convert phone number to E.164 format
 * @param phoneNumber - Phone number (with or without +)
 * @param countryCode - Country code (e.g., 'PH', 'US')
 * @returns Phone number in E.164 format (e.g., '+639123456789')
 */
export function formatPhoneToE164(phoneNumber: string, countryCode = 'PH'): string {
  if (!phoneNumber) {
    return '';
  }

  // Remove all non-digit characters except leading +
  let cleaned = phoneNumber.replace(/\D/g, '');

  // If already has + prefix or starts with country code, assume it's E.164-ready
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  // If the number doesn't start with country code digits, prepend it
  const countryInfo = PHONE_COUNTRY_CODES[countryCode as keyof typeof PHONE_COUNTRY_CODES];
  const countryDialCode = countryInfo?.dialCode.replace('+', '') || '63'; // Default to PH
  
  // Remove leading 0 if present (common in many countries)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If already has country code at the start, don't duplicate
  if (!cleaned.startsWith(countryDialCode)) {
    cleaned = countryDialCode + cleaned;
  }

  return '+' + cleaned;
}

/**
 * Validate if phone number is in E.164 format
 * @param phoneNumber - Phone number to validate
 * @returns true if valid E.164 format
 */
export function isValidE164(phoneNumber: string): boolean {
  const e164Regex = /^\+\d{10,15}$/;
  return e164Regex.test(phoneNumber);
}

