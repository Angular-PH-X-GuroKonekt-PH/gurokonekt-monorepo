import { COUNTRIES } from '../constants/countries.constants';
import { TIMEZONES, COUNTRY_TIMEZONE_MAP } from '../constants/timezones.constants';
import { LANGUAGES } from '../constants/languages.constants';
import { Country } from '../interfaces/country.interface';
import { Timezone } from '../interfaces/timezone.interface';
import { Language } from '../interfaces/language.interface';

// Re-export interfaces for convenience
export type { Country, Timezone, Language };

/**
 * Helper service for managing location and language data
 */
export class LocationDataHelper {
  
  /**
   * Standard list of countries
   */
  static readonly COUNTRIES = COUNTRIES;

  /**
   * Comprehensive timezone list with country associations
   */
  static readonly TIMEZONES = TIMEZONES;

  /**
   * Common languages supported
   */
  static readonly LANGUAGES = LANGUAGES;

  /**
   * Default timezone mapping for countries
   */
  private static readonly COUNTRY_TIMEZONE_MAP = COUNTRY_TIMEZONE_MAP;

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