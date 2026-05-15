import { DaysInWeek, UserAvailabilityInterface, TimeFrameInterface } from '@gurokonekt/models/interfaces/user/user.model';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';
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
      extendedProps: { day: slot.day, from: frame.from, to: frame.to, type: 'availability' },
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
      extendedProps: { type: 'blocked', bookingId: booking.id },
    };
  });

  return [...availabilityEvents, ...blockedEvents];
}

export function formatTimeRange(frame: TimeFrameInterface): string {
  const fmt = (t: string): string => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(frame.from)} – ${fmt(frame.to)}`;
}

export function isSlotBlocked(
  slot: UserAvailabilityInterface,
  blockedBookings: BookingCardInterface[]
): boolean {
  return blockedBookings.some((booking) => {
    const date = new Date(booking.sessionDateTime);
    const dayIndex = date.getDay();
    if (dayIndex !== DAY_OF_WEEK_MAP[slot.day]) return false;
    const bookingTime = date.getHours() * 60 + date.getMinutes();
    return slot.timeFrames.some((frame) => {
      const [fh, fm] = frame.from.split(':').map(Number);
      const [th, tm] = frame.to.split(':').map(Number);
      return bookingTime >= fh * 60 + fm && bookingTime < th * 60 + tm;
    });
  });
}
