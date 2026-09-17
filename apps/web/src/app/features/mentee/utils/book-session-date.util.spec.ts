import { buildAvailableBookingDatesFromSlots } from './book-session-date.util';

describe('buildAvailableBookingDatesFromSlots', () => {
  it('groups and displays UTC slots in the selected user timezone', () => {
    const result = buildAvailableBookingDatesFromSlots(
      [
        {
          start: '2099-09-08T17:00:00.000Z',
          end: '2099-09-08T18:00:00.000Z',
          timezone: 'Europe/Amsterdam',
        },
      ],
      'Asia/Manila',
    );

    expect(result).toHaveLength(1);
    expect(result[0].date.getFullYear()).toBe(2099);
    expect(result[0].date.getMonth()).toBe(8);
    expect(result[0].date.getDate()).toBe(9);
    expect(result[0].timeFrames[0]).toMatchObject({
      from: '01:00',
      to: '02:00',
    });
  });
});
