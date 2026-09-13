import {
  formatTimeInTimezone,
  getLocalDateTimeParts,
  isValidTimezone,
  localDateTimeToUtc,
} from '@gurokonekt/utils';

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

export function formatAvailabilityForViewer(
  day: string,
  from: string,
  to: string,
  sourceTimezone: string,
  viewerTimezone: string,
): string {
  if (!isValidTimezone(sourceTimezone) || !isValidTimezone(viewerTimezone)) {
    return formatAvailabilityLabel(day, from, to);
  }

  const dateKey = getNextWeekdayDateKey(day, sourceTimezone);
  const start = localDateTimeToUtc(dateKey, from, sourceTimezone);
  const end = localDateTimeToUtc(dateKey, to, sourceTimezone);

  if (!start || !end) {
    return formatAvailabilityLabel(day, from, to);
  }

  const startDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: viewerTimezone,
  }).format(start);
  const endDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: viewerTimezone,
  }).format(end);
  const startTime = formatTimeInTimezone(start, viewerTimezone);
  const endTime = formatTimeInTimezone(end, viewerTimezone);

  return startDate === endDate
    ? `${startDate}, ${startTime} - ${endTime}`
    : `${startDate}, ${startTime} - ${endDate}, ${endTime}`;
}

function getNextWeekdayDateKey(day: string, timezone: string): string {
  const now = new Date();
  const local = getLocalDateTimeParts(now, timezone);
  const currentDate = new Date(
    Date.UTC(local.year, local.month - 1, local.day),
  );
  const targetIndex = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ].indexOf(day.toLowerCase());
  const offset = (targetIndex - currentDate.getUTCDay() + 7) % 7;

  currentDate.setUTCDate(currentDate.getUTCDate() + offset);
  return currentDate.toISOString().slice(0, 10);
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
