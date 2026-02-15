/**
 * Country data with flags, labels, and phone codes
 */
export interface Country {
  value: string;
  label: string;
  flag: string;
  phoneCode: string;
}

/**
 * Timezone data with country associations
 */
export interface Timezone {
  value: string;
  label: string;
  countries: string[];
}

/**
 * Comprehensive list of countries with flags and phone codes
 */
export const COUNTRIES: Country[] = [
  { value: 'PH', label: 'Philippines', flag: '🇵🇭', phoneCode: '+63' },
  { value: 'US', label: 'United States', flag: '🇺🇸', phoneCode: '+1' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦', phoneCode: '+1' },
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺', phoneCode: '+61' },
  { value: 'DE', label: 'Germany', flag: '🇩🇪', phoneCode: '+49' },
  { value: 'FR', label: 'France', flag: '🇫🇷', phoneCode: '+33' },
  { value: 'ES', label: 'Spain', flag: '🇪🇸', phoneCode: '+34' },
  { value: 'IT', label: 'Italy', flag: '🇮🇹', phoneCode: '+39' },
  { value: 'JP', label: 'Japan', flag: '🇯🇵', phoneCode: '+81' },
  { value: 'CN', label: 'China', flag: '🇨🇳', phoneCode: '+86' },
  { value: 'IN', label: 'India', flag: '🇮🇳', phoneCode: '+91' },
  { value: 'BR', label: 'Brazil', flag: '🇧🇷', phoneCode: '+55' },
  { value: 'MX', label: 'Mexico', flag: '🇲🇽', phoneCode: '+52' },
  { value: 'NL', label: 'Netherlands', flag: '🇳🇱', phoneCode: '+31' },
  { value: 'SE', label: 'Sweden', flag: '🇸🇪', phoneCode: '+46' },
  { value: 'NO', label: 'Norway', flag: '🇳🇴', phoneCode: '+47' },
  { value: 'DK', label: 'Denmark', flag: '🇩🇰', phoneCode: '+45' },
  { value: 'FI', label: 'Finland', flag: '🇫🇮', phoneCode: '+358' },
  { value: 'SG', label: 'Singapore', flag: '🇸🇬', phoneCode: '+65' },
  { value: 'KR', label: 'South Korea', flag: '🇰🇷', phoneCode: '+82' },
];

/**
 * Enhanced timezones with country associations
 */
export const TIMEZONES: Timezone[] = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time (ET)', countries: ['US', 'CA'] },
  { value: 'America/Chicago', label: 'Central Time (CT)', countries: ['US', 'CA', 'MX'] },
  { value: 'America/Denver', label: 'Mountain Time (MT)', countries: ['US', 'CA', 'MX'] },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', countries: ['US', 'CA'] },
  { value: 'America/Sao_Paulo', label: 'Brazil Time (BRT)', countries: ['BR'] },
  { value: 'America/Mexico_City', label: 'Central Standard Time (CST)', countries: ['MX'] },
  // Europe
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', countries: ['GB'] },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', countries: ['FR', 'DE', 'ES', 'IT', 'NL'] },
  { value: 'Europe/Stockholm', label: 'Central European Time (CET)', countries: ['SE', 'NO', 'DK', 'FI'] },
  // Asia Pacific
  { value: 'Asia/Manila', label: 'Philippine Standard Time (PST)', countries: ['PH'] },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', countries: ['JP'] },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', countries: ['CN'] },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', countries: ['KR'] },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', countries: ['IN'] },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', countries: ['SG'] },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', countries: ['AU'] },
];

/**
 * Default timezone mapping for each country
 */
export const COUNTRY_TIMEZONE_MAP: { [key: string]: string } = {
  'PH': 'Asia/Manila',
  'US': 'America/New_York',
  'CA': 'America/New_York', 
  'GB': 'Europe/London',
  'AU': 'Australia/Sydney',
  'DE': 'Europe/Paris',
  'FR': 'Europe/Paris',
  'ES': 'Europe/Paris',
  'IT': 'Europe/Paris',
  'JP': 'Asia/Tokyo',
  'CN': 'Asia/Shanghai',
  'IN': 'Asia/Kolkata',
  'BR': 'America/Sao_Paulo',
  'MX': 'America/Mexico_City',
  'NL': 'Europe/Paris',
  'SE': 'Europe/Stockholm',
  'NO': 'Europe/Stockholm',
  'DK': 'Europe/Stockholm',
  'FI': 'Europe/Stockholm',
  'SG': 'Asia/Singapore',
  'KR': 'Asia/Seoul',
};

/**
 * Get country flag emoji by country code
 */
export function getCountryFlag(countryCode: string): string {
  const country = COUNTRIES.find(c => c.value === countryCode);
  return country?.flag || '🌍';
}

/**
 * Get phone code by country code
 */
export function getPhoneCode(countryCode: string): string {
  const country = COUNTRIES.find(c => c.value === countryCode);
  return country?.phoneCode || '+1';
}

/**
 * Get country display name by country code
 */
export function getCountryDisplayName(countryCode: string): string {
  const country = COUNTRIES.find(c => c.value === countryCode);
  return country?.label || '';
}

/**
 * Get timezone display name by timezone value
 */
export function getTimezoneDisplayName(timezoneValue: string): string {
  const timezone = TIMEZONES.find(tz => tz.value === timezoneValue);
  return timezone?.label || '';
}

/**
 * Get default timezone for a country
 */
export function getDefaultTimezoneForCountry(countryCode: string): string {
  return COUNTRY_TIMEZONE_MAP[countryCode] || 'America/New_York';
}

/**
 * Get selected phone country information
 */
export function getSelectedPhoneCountry(countryCode: string) {
  const country = COUNTRIES.find(c => c.value === countryCode);
  if (!country) {
    return { flag: '🇵🇭', phoneCode: '+63', label: 'Philippines' };
  }
  return {
    flag: country.flag,
    phoneCode: country.phoneCode,
    label: country.label
  };
}