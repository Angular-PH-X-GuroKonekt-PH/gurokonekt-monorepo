import {
  BOOKING_DATE_RANGE_DAYS,
  buildAvailableBookingDates,
  getBrowserTimezone,
} from './book-session-date.util';
import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

export interface ViewerAvailabilityGroup {
  dayLabel: string;
  timeLabels: string[];
}

export function convertAvailabilityForViewer(
  availability: UserAvailabilityInterface[],
  mentorTimezone: string | null | undefined,
  viewerTimezone = getBrowserTimezone()
): ViewerAvailabilityGroup[] {
  return buildAvailableBookingDates(
    availability,
    Math.min(BOOKING_DATE_RANGE_DAYS, 7),
    mentorTimezone || viewerTimezone,
    viewerTimezone
  ).map((date) => ({
    dayLabel: date.dayLabel,
    timeLabels: date.slots.map((slot) => slot.label),
  }));
}

export function formatTimeTo12Hour(time: string): string {
  const [hourValue, minute] = time.split(':');
  const hour = Number(hourValue);

  if (!Number.isFinite(hour) || !minute) {
    return time;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;

  return `${normalizedHour}:${minute} ${period}`;
}

export function formatAvailabilityLabel(
  day: string,
  from: string,
  to: string
): string {
  return `${formatDayLabel(day)}, ${formatTimeTo12Hour(from)} - ${formatTimeTo12Hour(to)}`;
}

export function formatDayLabel(day: string): string {
  return capitalize(day);
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}
