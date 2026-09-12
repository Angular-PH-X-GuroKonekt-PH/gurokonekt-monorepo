import { AvailabilitySlotInstanceInterface } from '@gurokonekt/models/interfaces/user/user.model';
import { getLocalDateTimeParts, isValidTimezone } from '@gurokonekt/utils';

import { BookSessionDateOption } from '../interfaces/book-session.interface';

export const BOOKING_DATE_RANGE_DAYS = 90;

export function buildAvailableBookingDatesFromSlots(
  slots: AvailabilitySlotInstanceInterface[],
  timezone: string,
): BookSessionDateOption[] {
  const grouped = new Map<string, BookSessionDateOption>();
  const displayTimezone = isValidTimezone(timezone)
    ? timezone
    : Intl.DateTimeFormat().resolvedOptions().timeZone;

  for (const slot of slots) {
    const start = new Date(slot.start);
    if (start <= new Date()) continue;
    const end = new Date(slot.end);
    const startParts = getLocalDateTimeParts(start, displayTimezone);
    const endParts = getLocalDateTimeParts(end, displayTimezone);
    const date = new Date(
      startParts.year,
      startParts.month - 1,
      startParts.day,
    );
    const dateKey = getDateKey(date);
    const entry = grouped.get(dateKey) ?? {
      date,
      day: start
        .toLocaleDateString('en-US', {
          weekday: 'long',
          timeZone: displayTimezone,
        })
        .toLowerCase(),
      dayLabel: start.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: displayTimezone,
      }),
      dateLabel: start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: displayTimezone,
      }),
      timeFrames: [],
    };
    entry.timeFrames.push({
      from: `${String(startParts.hour).padStart(2, '0')}:${String(
        startParts.minute,
      ).padStart(2, '0')}`,
      to: `${String(endParts.hour).padStart(2, '0')}:${String(
        endParts.minute,
      ).padStart(2, '0')}`,
      start: slot.start,
      end: slot.end,
    });
    grouped.set(dateKey, entry);
  }

  return [...grouped.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export function buildDisplayDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);

  result.setHours(hours, minutes, 0, 0);

  return result;
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
