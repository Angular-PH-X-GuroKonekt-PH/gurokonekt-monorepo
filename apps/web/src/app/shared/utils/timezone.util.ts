import { COUNTRY_TIMEZONES } from '../constants/timezone-mapping.constants';

/** Timezone helpers for country-based detection and date formatting. */

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

/**
 * Format an instant using an IANA timezone such as `Europe/Paris`.
 * Intl is used here because Angular's DatePipe timezone argument only
 * reliably accepts UTC offsets, not IANA timezone identifiers.
 */
export function formatDateInTimezone(
  value: Date | string | number,
  timezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    ...options,
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(date);
}
