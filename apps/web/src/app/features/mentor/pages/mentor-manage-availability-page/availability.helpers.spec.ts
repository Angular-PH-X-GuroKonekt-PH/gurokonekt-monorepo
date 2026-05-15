import { describe, it, expect } from 'vitest';
import { formatTimeRange, isSlotBlocked, mapAvailabilityToCalendarEvents } from './availability.helpers';
import { DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';
import { BookingCardInterface, BookingStatus } from '@gurokonekt/models/interfaces/booking/booking.model';

describe('formatTimeRange', () => {
  it('formats a morning range', () => {
    expect(formatTimeRange({ from: '09:00', to: '12:00' })).toBe('9:00 AM – 12:00 PM');
  });

  it('formats a range spanning noon', () => {
    expect(formatTimeRange({ from: '11:30', to: '13:00' })).toBe('11:30 AM – 1:00 PM');
  });

  it('formats midnight as 12:00 AM', () => {
    expect(formatTimeRange({ from: '00:00', to: '01:00' })).toBe('12:00 AM – 1:00 AM');
  });
});

describe('isSlotBlocked', () => {
  const makeBooking = (date: Date): BookingCardInterface =>
    ({
      id: 'b1',
      sessionDateTime: date,
      status: BookingStatus.APPROVED,
      isDeleted: false,
    } as unknown as BookingCardInterface);

  it('returns true when a booking falls within the slot time frame', () => {
    const monday10am = new Date('2024-01-08T10:00:00'); // Monday
    const slot = { day: DaysInWeek.Monday, timeFrames: [{ from: '09:00', to: '12:00' }] };
    expect(isSlotBlocked(slot, [makeBooking(monday10am)])).toBe(true);
  });

  it('returns false when booking is on a different day', () => {
    const tuesday10am = new Date('2024-01-09T10:00:00'); // Tuesday
    const slot = { day: DaysInWeek.Monday, timeFrames: [{ from: '09:00', to: '12:00' }] };
    expect(isSlotBlocked(slot, [makeBooking(tuesday10am)])).toBe(false);
  });

  it('returns false when booking is outside the time frame', () => {
    const monday2pm = new Date('2024-01-08T14:00:00');
    const slot = { day: DaysInWeek.Monday, timeFrames: [{ from: '09:00', to: '12:00' }] };
    expect(isSlotBlocked(slot, [makeBooking(monday2pm)])).toBe(false);
  });

  it('returns false with no bookings', () => {
    const slot = { day: DaysInWeek.Monday, timeFrames: [{ from: '09:00', to: '12:00' }] };
    expect(isSlotBlocked(slot, [])).toBe(false);
  });
});

describe('mapAvailabilityToCalendarEvents', () => {
  it('produces recurring availability events', () => {
    const avail = [{ day: DaysInWeek.Monday, timeFrames: [{ from: '09:00', to: '12:00' }] }];
    const events = mapAvailabilityToCalendarEvents(avail, []);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ daysOfWeek: [1], startTime: '09:00', endTime: '12:00', color: '#f97316' });
  });

  it('produces background events for blocked bookings', () => {
    const booking = {
      id: 'b1',
      sessionDateTime: new Date('2024-01-08T10:00:00'),
    } as unknown as BookingCardInterface;
    const events = mapAvailabilityToCalendarEvents([], [booking], 60);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ display: 'background', color: '#ef4444' });
  });
});
