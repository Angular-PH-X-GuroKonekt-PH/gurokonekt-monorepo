import {
  DaysInWeek,
  TimeFrameAvailabilityStatus,
  UserAvailabilityInterface,
  TimeFrameInterface,
} from '@gurokonekt/models/interfaces/user/user.model';
import {
  ActiveBookingSummaryInterface,
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { EventInput } from '@fullcalendar/core';

const DAY_OF_WEEK_MAP: Record<DaysInWeek, number> = {
  [DaysInWeek.Monday]: 1,
  [DaysInWeek.Tuesday]: 2,
  [DaysInWeek.Wednesday]: 3,
  [DaysInWeek.Thursday]: 4,
  [DaysInWeek.Friday]: 5,
  [DaysInWeek.Saturday]: 6,
  [DaysInWeek.Sunday]: 0,
};

export function mapAvailabilityToCalendarEvents(
  availabilities: UserAvailabilityInterface[],
  blockedBookings: BookingCardInterface[],
  sessionDurationMinutes = 60
): EventInput[] {
  const availabilityEvents: EventInput[] = availabilities.flatMap((slot) =>
    slot.timeFrames.map((frame: TimeFrameInterface) => ({
      daysOfWeek: [DAY_OF_WEEK_MAP[slot.day]],
      startTime: frame.from,
      endTime: frame.to,
      color: '#f97316',
      extendedProps: {
        day: slot.day,
        from: frame.from,
        to: frame.to,
        type: 'availability',
      },
    }))
  );

  const blockedEvents: EventInput[] = blockedBookings.map((booking) => {
    const start = new Date(booking.sessionDateTime);
    const end = new Date(start.getTime() + sessionDurationMinutes * 60 * 1000);

    return {
      start,
      end,
      display: 'background',
      color: '#ef4444',
      extendedProps: {
        type: 'blocked',
        bookingId: booking.id,
      },
    };
  });

  return [...availabilityEvents, ...blockedEvents];
}

export function formatTimeRange(frame: TimeFrameInterface): string {
  const fmt = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;

    return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return `${fmt(frame.from)} - ${fmt(frame.to)}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDayFromDate(date: Date): DaysInWeek {
  const map: Record<number, DaysInWeek> = {
    0: DaysInWeek.Sunday,
    1: DaysInWeek.Monday,
    2: DaysInWeek.Tuesday,
    3: DaysInWeek.Wednesday,
    4: DaysInWeek.Thursday,
    5: DaysInWeek.Friday,
    6: DaysInWeek.Saturday,
  };

  return map[date.getDay()];
}

export function getWeekStartFromWeekValue(weekValue: string): Date {
  const [yearText, weekText] = weekValue.split('-W');
  const year = Number(yearText);
  const week = Number(weekText);

  const firstDayOfYear = new Date(year, 0, 1);
  const firstDayOfYearDay = firstDayOfYear.getDay() || 7;
  const monday = new Date(year, 0, 1 + (week - 1) * 7);

  if (firstDayOfYearDay <= 4) {
    monday.setDate(monday.getDate() - firstDayOfYearDay + 1);
  } else {
    monday.setDate(monday.getDate() + 8 - firstDayOfYearDay);
  }

  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function toWeekInputValue(date: Date): string {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));

  const weekOne = new Date(target.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - weekOne.getTime()) / 86400000 -
        3 +
        ((weekOne.getDay() + 6) % 7)) /
        7
    );

  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

export function getDateForDay(
  day: DaysInWeek,
  days: DaysInWeek[],
  selectedWeekValue: string
): Date {
  const weekStart = getWeekStartFromWeekValue(selectedWeekValue);
  const dayIndex = days.indexOf(day);

  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + dayIndex);

  return date;
}

export function formatBookingTime(
  booking: BookingCardInterface,
  sessionDurationMinutes: number
): string {
  const start = new Date(booking.sessionDateTime);
  const end = new Date(start.getTime() + sessionDurationMinutes * 60 * 1000);

  return `${start.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function isBookingInsideSlot(
  booking: BookingCardInterface,
  slot: UserAvailabilityInterface,
  sessionDurationMinutes = 60
): boolean {
  const date = new Date(booking.sessionDateTime);

  if (getDayFromDate(date) !== slot.day) return false;

  const bookingStart = date.getHours() * 60 + date.getMinutes();
  const bookingEnd = bookingStart + sessionDurationMinutes;

  return slot.timeFrames.some((frame) => {
    const frameStart = timeToMinutes(frame.from);
    const frameEnd = timeToMinutes(frame.to);

    return bookingStart >= frameStart && bookingEnd <= frameEnd;
  });
}

export function getActiveBookingForFrame(
  frame: TimeFrameInterface,
  targetDate: Date,
  blockedBookings: BookingCardInterface[],
  sessionDurationMinutes: number
): BookingCardInterface | null {
  const frameStart = timeToMinutes(frame.from);
  const frameEnd = timeToMinutes(frame.to);

  return blockedBookings.find((item) => {
    const bookingDate = new Date(item.sessionDateTime);
    const bookingStart = bookingDate.getHours() * 60 + bookingDate.getMinutes();
    const bookingEnd = bookingStart + sessionDurationMinutes;

    return (
      isSameDate(bookingDate, targetDate) &&
      bookingStart >= frameStart &&
      bookingEnd <= frameEnd
    );
  }) ?? null;
}

export function getActiveBookingSummariesForDay(
  slot: UserAvailabilityInterface | null,
  targetDate: Date,
  blockedBookings: BookingCardInterface[],
  sessionDurationMinutes: number
): ActiveBookingSummaryInterface[] {
  if (!slot) return [];

  return blockedBookings
    .filter((booking) => {
      const bookingDate = new Date(booking.sessionDateTime);

      return (
        isSameDate(bookingDate, targetDate) &&
        isBookingInsideSlot(booking, slot, sessionDurationMinutes)
      );
    })
    .map((booking) => ({
      time: formatBookingTime(booking, sessionDurationMinutes),
      status: booking.status,
    }));
}

export function getAvailableSlotCount(
  slot: UserAvailabilityInterface | null,
  targetDate: Date,
  blockedBookings: BookingCardInterface[],
  sessionDurationMinutes: number
): number {
  if (!slot) return 0;

  return slot.timeFrames.filter(
    (frame) =>
      !getActiveBookingForFrame(
        frame,
        targetDate,
        blockedBookings,
        sessionDurationMinutes
      )
  ).length;
}

export function getBookingSummaryLabel(
  bookings: ActiveBookingSummaryInterface[]
): string {
  if (bookings.length === 0) return 'None';

  const pendingCount = bookings.filter(
    (booking) => booking.status === BookingStatus.PENDING
  ).length;
  const approvedCount = bookings.filter(
    (booking) => booking.status === BookingStatus.APPROVED
  ).length;
  const parts: string[] = [];

  if (pendingCount > 0) {
    parts.push(`${pendingCount} ${pendingCount === 1 ? 'pending' : 'pending'}`);
  }

  if (approvedCount > 0) {
    parts.push(`${approvedCount} ${approvedCount === 1 ? 'approved' : 'approved'}`);
  }

  return parts.join(', ');
}

export function getTimeFrameStatus(
  booking: BookingCardInterface | null
): TimeFrameAvailabilityStatus {
  if (!booking) return 'Available';

  return booking.status === BookingStatus.PENDING ? 'Pending' : 'Approved';
}

export function getBookingBadgeClasses(status: BookingStatus): string {
  const baseClasses =
    'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset';

  return status === BookingStatus.PENDING
    ? `${baseClasses} bg-amber-50 text-amber-700 ring-amber-200`
    : `${baseClasses} bg-red-50 text-red-700 ring-red-200`;
}
