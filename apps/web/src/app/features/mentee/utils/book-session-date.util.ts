import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

import {
  BookSessionDateOption,
  BookSessionSlotOption,
} from '../interfaces/book-session.interface';

export const BOOKING_DATE_RANGE_DAYS = 90;

export function buildAvailableBookingDates(
  availability: UserAvailabilityInterface[],
  daysToShow = BOOKING_DATE_RANGE_DAYS,
  mentorTimezone = getBrowserTimezone(),
  viewerTimezone = getBrowserTimezone()
): BookSessionDateOption[] {
  const datesByViewerDate = new Map<string, BookSessionDateOption>();
  const now = new Date();

  // Availability days and times are defined in the mentor's timezone.
  getNextDays(daysToShow, mentorTimezone).forEach((mentorDate) => {
    const dayName = getDayName(mentorDate);
    const dayAvailability = availability.find(
      (availableDay) => availableDay.day === dayName
    );

    if (!dayAvailability?.timeFrames?.length) {
      return;
    }

    dayAvailability.timeFrames.forEach((timeFrame) => {
      const bookingDateTime = buildZonedDateTime(
        mentorDate,
        timeFrame.from,
        mentorTimezone
      );

      if (bookingDateTime <= now) {
        return;
      }

      const viewerStart = getTimeZoneParts(bookingDateTime, viewerTimezone);
      const viewerEnd = getTimeZoneParts(
        buildZonedDateTime(mentorDate, timeFrame.to, mentorTimezone),
        viewerTimezone
      );
      const displayDateTime = createLocalDate(viewerStart);
      const dateKey = getDateKey(displayDateTime);
      const slot: BookSessionSlotOption = {
        label: `${formatTime(viewerStart)} - ${formatTime(viewerEnd)}`,
        displayDateTime,
        bookingDateTime,
        isBooked: false,
      };
      const existingDate = datesByViewerDate.get(dateKey);

      if (existingDate) {
        existingDate.slots.push(slot);
        return;
      }

      datesByViewerDate.set(dateKey, {
        date: displayDateTime,
        day: dayAvailability.day,
        dayLabel: displayDateTime.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        dateLabel: displayDateTime.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        slots: [slot],
      });
    });
  });

  return [...datesByViewerDate.values()].sort(
    (first, second) => first.date.getTime() - second.date.getTime()
  );
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getBookingSlotKey(date: Date): string {
  return date.toISOString().slice(0, 16);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function getNextDays(count: number, timezone: string): Date[] {
  const today = getTimeZoneParts(new Date(), timezone);

  return Array.from({ length: count }, (_, index) => {
    const date = createLocalDate(today);
    date.setDate(date.getDate() + index);
    return date;
  });
}

function getDayName(date: Date): string {
  return date
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();
}

function buildZonedDateTime(
  date: Date,
  time: string,
  timezone: string
): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const targetWallTime = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  );
  let result = new Date(targetWallTime);

  // Recalculate once after applying the timezone offset for DST transitions.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    result = new Date(targetWallTime - getOffsetMinutes(result, timezone) * 60000);
  }

  return result;
}

function getOffsetMinutes(date: Date, timezone: string): number {
  const parts = getTimeZoneParts(date, timezone);
  const zonedWallTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return (zonedWallTime - date.getTime()) / 60000;
}

function getTimeZoneParts(date: Date, timezone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
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
      .map(({ type, value }) => [type, Number(value)])
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

function createLocalDate(parts: DateTimeParts): Date {
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );
}

function formatTime(parts: DateTimeParts): string {
  return createLocalDate(parts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}
