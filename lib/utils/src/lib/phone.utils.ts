/**
 * Phone number formatting and validation utilities
 */

/**
 * Get phone format placeholder based on country code
 */
export function getPhoneFormatPlaceholder(countryCode: string): string {
  switch (countryCode) {
    case 'US':
    case 'CA':
      return '(555) 123-4567';
    case 'PH':
      return '912 345 6789';
    case 'GB':
      return '20 7123 4567';
    case 'DE':
      return '30 12345678';
    case 'FR':
      return '1 23 45 67 89';
    case 'AU':
      return '2 1234 5678';
    case 'JP':
      return '3-1234-5678';
    case 'CN':
      return '138 0013 8000';
    case 'IN':
      return '98765 43210';
    case 'BR':
      return '11 99999-9999';
    case 'MX':
      return '55 1234 5678';
    default:
      return 'Enter phone number';
  }
}

/**
 * Get phone error message based on form control errors
 */
export function getPhoneErrorMessage(errors: any): string {
  if (errors?.required) {
    return 'Phone number is required';
  }
  if (errors?.pattern) {
    return 'Please enter a valid phone number';
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