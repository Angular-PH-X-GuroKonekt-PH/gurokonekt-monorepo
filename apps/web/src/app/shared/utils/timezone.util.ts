import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

import { COUNTRY_TIMEZONES } from '../constants/timezone-mapping.constants';

export interface TimeZoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface AvailabilityOccurrence {
  sourceDay: string;
  sourceFrom: string;
  sourceTo: string;
  sourceTimezone: string;
  start: Date;
  end: Date;
  viewerStart: TimeZoneParts;
  viewerEnd: TimeZoneParts;
}

export function getTimezoneForCountry(country: string): string {
  if (!country) return '';

  const directMatch = COUNTRY_TIMEZONES[country];
  if (directMatch) return directMatch;

  const normalizedCountry = country.toLowerCase();
  return Object.entries(COUNTRY_TIMEZONES).find(
    ([key]) => key.toLowerCase() === normalizedCountry,
  )?.[1] ?? '';
}

/** The browser timezone follows the device's current timezone setting. */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isValidTimezone(timezone: string | null | undefined): timezone is string {
  if (!timezone?.trim()) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function formatDateInTimezone(
  value: Date | string | number,
  timezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const resolvedTimezone = isValidTimezone(timezone)
    ? timezone
    : getBrowserTimezone();

  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: resolvedTimezone,
  }).format(date);
}

/**
 * Normalizes availability entries and applies the mentor profile timezone when
 * an entry does not yet have its own IANA timezone.
 */
export function getAvailabilityForDisplay(
  availability: UserAvailabilityInterface[],
  fallbackTimezone?: string | null,
): UserAvailabilityInterface[] {
  const resolvedFallback = isValidTimezone(fallbackTimezone)
    ? fallbackTimezone
    : 'UTC';

  return availability.map((dayAvailability) => ({
    ...dayAvailability,
    timezone: isValidTimezone(dayAvailability.timezone)
      ? dayAvailability.timezone
      : resolvedFallback,
  }));
}

export function getAvailabilityOccurrences(
  availability: UserAvailabilityInterface[],
  fallbackTimezone: string | null | undefined,
  viewerTimezone: string,
  daysToShow: number,
  from = new Date(),
): AvailabilityOccurrence[] {
  const targetTimezone = isValidTimezone(viewerTimezone)
    ? viewerTimezone
    : getBrowserTimezone();
  const normalizedAvailability = getAvailabilityForDisplay(
    availability,
    fallbackTimezone,
  );
  const occurrences: AvailabilityOccurrence[] = [];

  for (const dayAvailability of normalizedAvailability) {
    const sourceTimezone = dayAvailability.timezone || 'UTC';
    const sourceNow = getTimeZoneParts(from, sourceTimezone);

    for (let offset = 0; offset < daysToShow; offset += 1) {
      const sourceDate = new Date(
        Date.UTC(
          sourceNow.year,
          sourceNow.month - 1,
          sourceNow.day + offset,
        ),
      );
      const sourceDay = getWeekday(sourceDate);

      if (sourceDay !== dayAvailability.day.toLowerCase()) {
        continue;
      }

      for (const timeFrame of dayAvailability.timeFrames ?? []) {
        const start = buildZonedDateTime(
          sourceDate,
          timeFrame.from,
          sourceTimezone,
        );
        const end = buildZonedDateTime(
          sourceDate,
          timeFrame.to,
          sourceTimezone,
        );

        if (end <= start || start <= from) {
          continue;
        }

        occurrences.push({
          sourceDay: dayAvailability.day,
          sourceFrom: timeFrame.from,
          sourceTo: timeFrame.to,
          sourceTimezone,
          start,
          end,
          viewerStart: getTimeZoneParts(start, targetTimezone),
          viewerEnd: getTimeZoneParts(end, targetTimezone),
        });
      }
    }
  }

  return occurrences.sort((first, second) => first.start.getTime() - second.start.getTime());
}

export function buildZonedDateTime(
  date: Date,
  time: string,
  timezone: string,
): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const wallTime = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
    0,
    0,
  );
  let result = new Date(wallTime);

  // Recalculate after applying the timezone offset so DST changes are respected.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    result = new Date(wallTime - getOffsetMinutes(result, timezone) * 60_000);
  }

  return result;
}

export function getTimeZoneParts(
  date: Date,
  timezone: string,
): TimeZoneParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: isValidTimezone(timezone) ? timezone : 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  );

  return {
    year: values['year'],
    month: values['month'],
    day: values['day'],
    hour: values['hour'],
    minute: values['minute'],
    second: values['second'],
  };
}

export function createLocalDate(parts: TimeZoneParts): Date {
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0,
  );
}

export function formatTimeParts(parts: TimeZoneParts): string {
  return createLocalDate(parts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getWeekday(date: Date): string {
  return date
    .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
    .toLowerCase();
}

function getOffsetMinutes(date: Date, timezone: string): number {
  const parts = getTimeZoneParts(date, timezone);
  const zonedWallTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return (zonedWallTime - date.getTime()) / 60_000;
}
