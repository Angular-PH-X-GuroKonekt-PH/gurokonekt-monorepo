import { buildAvailableBookingDates } from './book-session-date.util';

describe('buildAvailableBookingDates', () => {
  it('keeps the UTC instant while displaying the slot in the viewer timezone', () => {
    const [date] = buildAvailableBookingDates(
      [
        {
          day: 'monday',
          timezone: 'Europe/Amsterdam',
          timeFrames: [{ from: '06:00', to: '07:00' }],
        },
      ],
      7,
      'UTC',
      'Asia/Manila',
      new Date('2026-06-14T00:00:00.000Z'),
    );
    const [slot] = date.slots;

    expect(slot.label).toBe('12:00 PM - 1:00 PM');
    expect(slot.bookingDateTime.toISOString()).toBe('2026-06-15T04:00:00.000Z');
    expect(slot.sourceDay).toBe('monday');
    expect(slot.sourceFrom).toBe('06:00');
    expect(slot.sourceTo).toBe('07:00');
    expect(slot.sourceTimezone).toBe('Europe/Amsterdam');
  });
});
