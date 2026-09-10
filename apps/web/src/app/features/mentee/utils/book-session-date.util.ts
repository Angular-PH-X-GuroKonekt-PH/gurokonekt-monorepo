import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

import {
  BookSessionDateOption,
  BookSessionSlotOption,
} from '../interfaces/book-session.interface';
import {
  createLocalDate,
  formatTimeParts,
  getAvailabilityOccurrences,
  getBrowserTimezone,
} from '../../../shared/utils/timezone.util';

export const BOOKING_DATE_RANGE_DAYS = 90;

export function buildAvailableBookingDates(
  availability: UserAvailabilityInterface[],
  daysToShow = BOOKING_DATE_RANGE_DAYS,
  mentorTimezone: string | null | undefined = getBrowserTimezone(),
  viewerTimezone = getBrowserTimezone(),
  from = new Date(),
): BookSessionDateOption[] {
  const datesByViewerDate = new Map<string, BookSessionDateOption>();
  const occurrences = getAvailabilityOccurrences(
    availability,
    mentorTimezone,
    viewerTimezone,
    daysToShow,
    from,
  );

  for (const occurrence of occurrences) {
    const displayDateTime = createLocalDate(occurrence.viewerStart);
    const dateKey = getDateKey(displayDateTime);
    const slot: BookSessionSlotOption = {
      label: `${formatTimeParts(occurrence.viewerStart)} - ${formatTimeParts(occurrence.viewerEnd)}`,
      displayDateTime,
      bookingDateTime: occurrence.start,
      sourceDay: occurrence.sourceDay,
      sourceFrom: occurrence.sourceFrom,
      sourceTo: occurrence.sourceTo,
      sourceTimezone: occurrence.sourceTimezone,
      isBooked: false,
    };
    const existingDate = datesByViewerDate.get(dateKey);

    if (existingDate) {
      existingDate.slots.push(slot);
      continue;
    }

    datesByViewerDate.set(dateKey, {
      date: displayDateTime,
      day: occurrence.sourceDay,
      dayLabel: displayDateTime.toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      dateLabel: displayDateTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      slots: [slot],
    });
  }

  return [...datesByViewerDate.values()].sort(
    (first, second) => first.date.getTime() - second.date.getTime(),
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

export { getBrowserTimezone };
