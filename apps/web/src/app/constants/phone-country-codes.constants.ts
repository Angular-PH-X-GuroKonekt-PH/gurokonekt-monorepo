/**
 * Country code mapping with dial codes and phone length validation
 */
export const PHONE_COUNTRY_CODES = {
  PH: { dialCode: '+63', name: 'Philippines', minLength: 10, maxLength: 10 },
  US: { dialCode: '+1', name: 'United States', minLength: 10, maxLength: 10 },
  CA: { dialCode: '+1', name: 'Canada', minLength: 10, maxLength: 10 },
  GB: { dialCode: '+44', name: 'United Kingdom', minLength: 10, maxLength: 11 },
  IN: { dialCode: '+91', name: 'India', minLength: 10, maxLength: 10 },
  AU: { dialCode: '+61', name: 'Australia', minLength: 9, maxLength: 9 },
  SG: { dialCode: '+65', name: 'Singapore', minLength: 8, maxLength: 8 },
  MY: { dialCode: '+60', name: 'Malaysia', minLength: 9, maxLength: 10 },
  TH: { dialCode: '+66', name: 'Thailand', minLength: 9, maxLength: 10 },
  JP: { dialCode: '+81', name: 'Japan', minLength: 10, maxLength: 11 },
  CN: { dialCode: '+86', name: 'China', minLength: 11, maxLength: 11 },
  DE: { dialCode: '+49', name: 'Germany', minLength: 10, maxLength: 13 },
  FR: { dialCode: '+33', name: 'France', minLength: 9, maxLength: 9 },
};
