import { COUNTRY_TIMEZONES } from '../constants/timezone-mapping.constants';

/**
 * Timezone helper for country-based timezone detection
 */

/**
 * Get default timezone for a country
 * @param country - Country name or code
 * @returns IANA timezone identifier
 */
export function getTimezoneForCountry(country: string): string {
  if (!country) {
    return '';
  }

  // Direct lookup
  const timezone = COUNTRY_TIMEZONES[country];
  if (timezone) {
    return timezone;
  }

  // Try case-insensitive lookup
  const countryLower = country.toLowerCase();
  for (const [key, value] of Object.entries(COUNTRY_TIMEZONES)) {
    if (key.toLowerCase() === countryLower) {
      return value;
    }
  }

  return '';
}
