import { COUNTRIES, Country, getPhoneFormatPlaceholder } from '@gurokonekt/utils';
import { TIMEZONES, COUNTRY_TIMEZONE_MAP } from '../constants/timezones.constants';
import { LANGUAGES } from '../constants/languages.constants';
import { Timezone } from '../interfaces/timezone.interface';
import { Language } from '../interfaces/language.interface';

// Re-export interfaces for convenience
export type { Timezone, Language };

export const LOCATION_COUNTRIES = COUNTRIES;
export const LOCATION_TIMEZONES = TIMEZONES;
export const LOCATION_LANGUAGES = LANGUAGES;

/**
 * Utilities for managing location and language data
 */
export function getDefaultTimezoneForCountry(countryCode: string): string | undefined {
  return COUNTRY_TIMEZONE_MAP[countryCode];
}

  /**
   * Get timezones filtered by country
   */
export function getTimezonesForCountry(countryCode: string): Timezone[] {
  return LOCATION_TIMEZONES.filter((tz) => tz.countries.includes(countryCode));
}

  /**
   * Get all countries
   */
export function getCountries(): Country[] {
  return [...LOCATION_COUNTRIES];
}

  /**
   * Get all timezones
   */
export function getTimezones(): Timezone[] {
  return [...LOCATION_TIMEZONES];
}

  /**
   * Get all languages
   */
export function getLanguages(): Language[] {
  return [...LOCATION_LANGUAGES];
}

  /**
   * Find country by code
   */
export function findCountryByCode(code: string): Country | undefined {
  return LOCATION_COUNTRIES.find((country) => country.value === code);
}

  /**
   * Find timezone by value
   */
export function findTimezoneByValue(value: string): Timezone | undefined {
  return LOCATION_TIMEZONES.find((timezone) => timezone.value === value);
}

  /**
   * Find language by code
   */
export function findLanguageByCode(code: string): Language | undefined {
  return LOCATION_LANGUAGES.find((language) => language.value === code);
}

  /**
   * Validate phone number for a specific country
   */
export function validatePhoneNumber(phoneNumber: string, countryCode: string): boolean {
  const country = findCountryByCode(countryCode);
  if (!country) {
    return false;
  }

  const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
  const originalPhone = phoneNumber.trim();

  return (
    country.phoneRegex.test(cleanPhone) ||
    country.phoneRegex.test(originalPhone)
  );
}

  /**
   * Get phone validation error message for a country
   */
export function getPhoneValidationMessage(countryCode: string): string {
  const country = findCountryByCode(countryCode);
  if (!country) {
    return 'Please enter a valid phone number';
  }
  return `Please enter a valid ${country.label} phone number (e.g., ${getPhoneFormatPlaceholder(country.value)})`;
}

  /**
   * Get display name for country by code
   */
export function getCountryDisplayName(countryCode: string): string {
  const country = findCountryByCode(countryCode);
  return country?.label || countryCode;
}

  /**
   * Get display name for timezone by value
   */
export function getTimezoneDisplayName(timezoneValue: string): string {
  const timezone = findTimezoneByValue(timezoneValue);
  return timezone?.label || timezoneValue;
}

  /**
   * Get display name for language by code
   */
export function getLanguageDisplayName(langValue: string): string {
  const language = findLanguageByCode(langValue);
  return language?.label || langValue;
}