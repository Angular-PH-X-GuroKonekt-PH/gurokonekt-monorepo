/**
 * Country data with timezone mapping
 */
export interface Country {
  value: string;
  label: string;
  phoneCode: string;
  flag: string;
  phoneFormat: string;
  phoneRegex: RegExp;
}

export interface Timezone {
  value: string;
  label: string;
  countries: string[];
}

export interface Language {
  value: string;
  label: string;
}

/**
 * Helper service for managing location and language data
 */
export class LocationDataHelper {
  
  /**
   * Standard list of countries
   */
  static readonly COUNTRIES: Country[] = [
    { value: 'PH', label: 'Philippines', phoneCode: '+63', flag: '🇵🇭', phoneFormat: '999 123 4567', phoneRegex: /^[2-9]\d{2}\s?\d{3}\s?\d{4}$/ },
    { value: 'US', label: 'United States', phoneCode: '+1', flag: '🇺🇸', phoneFormat: '(555) 123-4567', phoneRegex: /^\(\d{3}\)\s?\d{3}-?\d{4}$/ },
    { value: 'CA', label: 'Canada', phoneCode: '+1', flag: '🇨🇦', phoneFormat: '(555) 123-4567', phoneRegex: /^\(\d{3}\)\s?\d{3}-?\d{4}$/ },
    { value: 'GB', label: 'United Kingdom', phoneCode: '+44', flag: '🇬🇧', phoneFormat: '07911 123456', phoneRegex: /^0[7]\d{3}\s?\d{6}$/ },
    { value: 'AU', label: 'Australia', phoneCode: '+61', flag: '🇦🇺', phoneFormat: '0412 345 678', phoneRegex: /^04\d{2}\s?\d{3}\s?\d{3}$/ },
    { value: 'DE', label: 'Germany', phoneCode: '+49', flag: '🇩🇪', phoneFormat: '0151 12345678', phoneRegex: /^015[0-9]\s?\d{8}$/ },
    { value: 'FR', label: 'France', phoneCode: '+33', flag: '🇫🇷', phoneFormat: '06 12 34 56 78', phoneRegex: /^0[67]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/ },
    { value: 'ES', label: 'Spain', phoneCode: '+34', flag: '🇪🇸', phoneFormat: '612 34 56 78', phoneRegex: /^[67]\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/ },
    { value: 'IT', label: 'Italy', phoneCode: '+39', flag: '🇮🇹', phoneFormat: '312 345 6789', phoneRegex: /^3\d{2}\s?\d{3}\s?\d{4}$/ },
    { value: 'JP', label: 'Japan', phoneCode: '+81', flag: '🇯🇵', phoneFormat: '90-1234-5678', phoneRegex: /^\d{2}-?\d{4}-?\d{4}$/ },
    { value: 'CN', label: 'China', phoneCode: '+86', flag: '🇨🇳', phoneFormat: '139 0013 8000', phoneRegex: /^1[3-9]\d\s?\d{4}\s?\d{4}$/ },
    { value: 'IN', label: 'India', phoneCode: '+91', flag: '🇮🇳', phoneFormat: '98765 43210', phoneRegex: /^[6-9]\d{4}\s?\d{5}$/ },
    { value: 'BR', label: 'Brazil', phoneCode: '+55', flag: '🇧🇷', phoneFormat: '(11) 99999-9999', phoneRegex: /^\(\d{2}\)\s?9?\d{4}-?\d{4}$/ },
    { value: 'MX', label: 'Mexico', phoneCode: '+52', flag: '🇲🇽', phoneFormat: '(55) 1234-5678', phoneRegex: /^\(\d{2}\)\s?\d{4}-?\d{4}$/ },
    { value: 'NL', label: 'Netherlands', phoneCode: '+31', flag: '🇳🇱', phoneFormat: '06 12345678', phoneRegex: /^06\s?\d{8}$/ },
    { value: 'SE', label: 'Sweden', phoneCode: '+46', flag: '🇸🇪', phoneFormat: '070-123 45 67', phoneRegex: /^07[0-9]-?\d{3}\s?\d{2}\s?\d{2}$/ },
    { value: 'NO', label: 'Norway', phoneCode: '+47', flag: '🇳🇴', phoneFormat: '406 12 345', phoneRegex: /^[49]\d{2}\s?\d{2}\s?\d{3}$/ },
    { value: 'DK', label: 'Denmark', phoneCode: '+45', flag: '🇩🇰', phoneFormat: '50 12 34 56', phoneRegex: /^[2-9]\d\s?\d{2}\s?\d{2}\s?\d{2}$/ },
    { value: 'FI', label: 'Finland', phoneCode: '+358', flag: '🇫🇮', phoneFormat: '050 123 4567', phoneRegex: /^0[45]\d\s?\d{3}\s?\d{4}$/ },
    { value: 'SG', label: 'Singapore', phoneCode: '+65', flag: '🇸🇬', phoneFormat: '9123 4567', phoneRegex: /^[89]\d{3}\s?\d{4}$/ },
    { value: 'KR', label: 'South Korea', phoneCode: '+82', flag: '🇰🇷', phoneFormat: '010-1234-5678', phoneRegex: /^010-?\d{4}-?\d{4}$/ },
  ];

  /**
   * Comprehensive timezone list with country associations
   */
  static readonly TIMEZONES: Timezone[] = [
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
   * Common languages supported
   */
  static readonly LANGUAGES: Language[] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'it', label: 'Italian' },
    { value: 'nl', label: 'Dutch' },
    { value: 'sv', label: 'Swedish' },
    { value: 'no', label: 'Norwegian' },
    { value: 'da', label: 'Danish' },
    { value: 'fi', label: 'Finnish' },
  ];

  /**
   * Default timezone mapping for countries
   */
  private static readonly COUNTRY_TIMEZONE_MAP: { [key: string]: string } = {
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
   * Get default timezone for a country
   */
  static getDefaultTimezoneForCountry(countryCode: string): string | undefined {
    return this.COUNTRY_TIMEZONE_MAP[countryCode];
  }

  /**
   * Get timezones filtered by country
   */
  static getTimezonesForCountry(countryCode: string): Timezone[] {
    return this.TIMEZONES.filter(tz => tz.countries.includes(countryCode));
  }

  /**
   * Get all countries
   */
  static getCountries(): Country[] {
    return [...this.COUNTRIES];
  }

  /**
   * Get all timezones
   */
  static getTimezones(): Timezone[] {
    return [...this.TIMEZONES];
  }

  /**
   * Get all languages
   */
  static getLanguages(): Language[] {
    return [...this.LANGUAGES];
  }

  /**
   * Find country by code
   */
  static findCountryByCode(code: string): Country | undefined {
    return this.COUNTRIES.find(country => country.value === code);
  }

  /**
   * Find timezone by value
   */
  static findTimezoneByValue(value: string): Timezone | undefined {
    return this.TIMEZONES.find(timezone => timezone.value === value);
  }

  /**
   * Find language by code
   */
  static findLanguageByCode(code: string): Language | undefined {
    return this.LANGUAGES.find(language => language.value === code);
  }

  /**
   * Validate phone number for a specific country
   */
  static validatePhoneNumber(phoneNumber: string, countryCode: string): boolean {
    const country = this.findCountryByCode(countryCode);
    if (!country) {
      return false;
    }
    
    // Remove all spaces, dashes, and parentheses for validation
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    const originalPhone = phoneNumber.trim();
    
    // Test both cleaned and original formats
    return country.phoneRegex.test(cleanPhone) || country.phoneRegex.test(originalPhone);
  }

  /**
   * Get phone validation error message for a country
   */
  static getPhoneValidationMessage(countryCode: string): string {
    const country = this.findCountryByCode(countryCode);
    if (!country) {
      return 'Please enter a valid phone number';
    }
    return `Please enter a valid ${country.label} phone number (e.g., ${country.phoneFormat})`;
  }

  /**
   * Get display name for country by code
   */
  static getCountryDisplayName(countryCode: string): string {
    const country = this.findCountryByCode(countryCode);
    return country?.label || countryCode;
  }

  /**
   * Get display name for timezone by value
   */
  static getTimezoneDisplayName(timezoneValue: string): string {
    const timezone = this.findTimezoneByValue(timezoneValue);
    return timezone?.label || timezoneValue;
  }

  /**
   * Get display name for language by code
   */
  static getLanguageDisplayName(langValue: string): string {
    const language = this.findLanguageByCode(langValue);
    return language?.label || langValue;
  }
}