import {
  AvailabilityOverrideInterface,
  AvailabilityOverrideType,
  AvailabilitySlotInstanceInterface,
  DaysInWeek,
  UserAvailabilityInterface,
} from '@gurokonekt/models/interfaces/user/user.model';

const DATE_TIME_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function formatter(timezone: string): Intl.DateTimeFormat {
  let value = DATE_TIME_FORMATTERS.get(timezone);
  if (!value) {
    value = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    DATE_TIME_FORMATTERS.set(timezone, value);
  }
  return value;
}

export function isValidTimezone(timezone: string): boolean {
  try {
    formatter(timezone).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function formatDateInTimezone(
  date: Date | string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(date));
}

export function formatTimeInTimezone(
  date: Date | string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(date));
}

export function formatTimeInputInTimezone(
  date: Date | string,
  timezone: string,
): string {
  const parts = getLocalDateTimeParts(new Date(date), timezone);
  return `${String(parts.hour).padStart(2, '0')}:${String(
    parts.minute,
  ).padStart(2, '0')}`;
}

export function getDateKeysInRange(
  startDate: string,
  endDate: string,
): string[] {
  const dates: string[] = [];
  const end = new Date(`${endDate}T00:00:00.000Z`);

  for (
    let date = new Date(`${startDate}T00:00:00.000Z`);
    date <= end;
    date = new Date(date.getTime() + 86_400_000)
  ) {
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

export function getLocalDateTimeParts(
  instant: Date,
  timezone: string,
): LocalDateTimeParts {
  const parts = Object.fromEntries(
    formatter(timezone)
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts['year'],
    month: parts['month'],
    day: parts['day'],
    hour: parts['hour'],
    minute: parts['minute'],
  };
}

/**
 * Converts a wall-clock date/time in an IANA timezone to UTC. If a fall-back
 * time occurs twice, the earlier instant is chosen. Spring-forward times that
 * do not exist return null.
 */
export function localDateTimeToUtc(
  date: string,
  time: string,
  timezone: string,
): Date | null {
  if (!isValidTimezone(timezone)) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const target = { year, month, day, hour, minute };
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set<number>();

  for (const hours of [-36, -24, -12, 0, 12, 24, 36]) {
    const probe = new Date(wallClockAsUtc + hours * 3_600_000);
    const local = getLocalDateTimeParts(probe, timezone);
    offsets.add(
      Date.UTC(
        local.year,
        local.month - 1,
        local.day,
        local.hour,
        local.minute,
      ) - probe.getTime(),
    );
  }

  const matches = [...offsets]
    .map((offset) => new Date(wallClockAsUtc - offset))
    .filter((candidate) => {
      const local = getLocalDateTimeParts(candidate, timezone);
      return Object.keys(target).every(
        (key) =>
          local[key as keyof LocalDateTimeParts] ===
          target[key as keyof LocalDateTimeParts],
      );
    })
    .sort((a, b) => a.getTime() - b.getTime());

  return matches[0] ?? null;
}

export function getDateKeyInTimezone(date: Date, timezone: string): string {
  const local = getLocalDateTimeParts(date, timezone);
  return `${local.year}-${String(local.month).padStart(2, '0')}-${String(
    local.day,
  ).padStart(2, '0')}`;
}

const WEEKDAYS: DaysInWeek[] = [
  DaysInWeek.Sunday,
  DaysInWeek.Monday,
  DaysInWeek.Tuesday,
  DaysInWeek.Wednesday,
  DaysInWeek.Thursday,
  DaysInWeek.Friday,
  DaysInWeek.Saturday,
];

export function materializeAvailabilitySlots(
  recurring: UserAvailabilityInterface[],
  overrides: AvailabilityOverrideInterface[],
  timezone: string,
  startDate: string,
  endDate: string,
  sessionDurationMinutes: number,
): AvailabilitySlotInstanceInterface[] {
  const slots: AvailabilitySlotInstanceInterface[] = [];
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  for (
    let date = start;
    date <= end;
    date = new Date(date.getTime() + 86_400_000)
  ) {
    const dateKey = date.toISOString().slice(0, 10);
    const exact = [...overrides]
      .reverse()
      .find(
        (entry) =>
          entry.type === AvailabilityOverrideType.CustomHours &&
          entry.startDate === dateKey,
      );
    const ranged = [...overrides]
      .reverse()
      .find(
        (entry) =>
          entry.type !== AvailabilityOverrideType.CustomHours &&
          entry.startDate <= dateKey &&
          entry.endDate >= dateKey &&
          !entry.excludedDates?.includes(dateKey),
      );
    const override = exact ?? ranged;
    const slotTimezone = override?.timezone ?? timezone;
    const weekday = WEEKDAYS[date.getUTCDay()];
    const frames = override
      ? override.type === AvailabilityOverrideType.Unavailable
        ? []
        : override.timeFrames
      : (recurring.find((entry) => entry.day === weekday)?.timeFrames ?? []);

    for (const frame of frames) {
      const utcStart = localDateTimeToUtc(dateKey, frame.from, slotTimezone);
      const localEnd = localDateTimeToUtc(dateKey, frame.to, slotTimezone);
      if (!utcStart || !localEnd) continue;

      slots.push({
        start: utcStart.toISOString(),
        end: new Date(
          utcStart.getTime() + sessionDurationMinutes * 60_000,
        ).toISOString(),
        timezone: slotTimezone,
      });
    }
  }

  return slots;
}
