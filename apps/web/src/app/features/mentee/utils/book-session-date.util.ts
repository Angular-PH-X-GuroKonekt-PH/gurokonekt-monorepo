import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

import { BookSessionDateOption } from '../interfaces/book-session.interface';

export const BOOKING_DATE_RANGE_DAYS = 90;

export function buildAvailableBookingDates(
  availability: UserAvailabilityInterface[],
  daysToShow = BOOKING_DATE_RANGE_DAYS
): BookSessionDateOption[] {
  // Convert weekly mentor availability into concrete bookable dates.
  return getNextDays(daysToShow).flatMap((date) => {
    const dayName = getDayName(date);
    const dayAvailability = availability.find(
      (availableDay) => availableDay.day === dayName
    );

    if (!dayAvailability?.timeFrames?.length) {
      return [];
    }

    const availableTimeFrames = dayAvailability.timeFrames.filter(
      (timeFrame) => buildDisplayDateTime(date, timeFrame.from) > new Date()
    );

    if (availableTimeFrames.length === 0) {
      return [];
    }

    return [
      {
        date,
        day: dayAvailability.day,
        dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateLabel: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        timeFrames: availableTimeFrames,
      },
    ];
  });
}

export function buildDisplayDateTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);

  result.setHours(hours, minutes, 0, 0);

  return result;
}

export function buildBookingDateTimeForApi(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);

  // Booking API validates availability using UTC hours.
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
      0
    )
  );
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextDays(count: number): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0);
    return date;
  });
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}
