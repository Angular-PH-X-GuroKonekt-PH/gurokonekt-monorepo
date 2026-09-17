import {
  AvailabilityOverrideType,
  DaysInWeek,
} from '@gurokonekt/models/interfaces/user/user.model';
import {
  formatDateInTimezone,
  formatTimeInTimezone,
  formatTimeInputInTimezone,
  getDateKeysInRange,
  haveSameTimezoneOffset,
  localDateTimeToUtc,
  materializeAvailabilitySlots,
} from '@gurokonekt/utils';

describe('timezone availability utilities', () => {
  it('treats different timezone names with the same offset as equivalent', () => {
    const instant = new Date('2026-09-14T00:00:00.000Z');

    expect(
      haveSameTimezoneOffset('Asia/Manila', 'Asia/Singapore', instant),
    ).toBe(true);
    expect(
      haveSameTimezoneOffset('Asia/Manila', 'Asia/Tokyo', instant),
    ).toBe(false);
  });

  it('formats a UTC booking in the selected IANA timezone', () => {
    const booking = '2026-09-14T23:00:00.000Z';

    expect(formatDateInTimezone(booking, 'Australia/Sydney')).toBe(
      'Sep 15, 2026',
    );
    expect(formatTimeInTimezone(booking, 'Australia/Sydney')).toBe('9:00 AM');
    expect(formatTimeInputInTimezone(booking, 'Australia/Sydney')).toBe(
      '09:00',
    );
  });

  it('expands an inclusive date range into individual dates', () => {
    expect(getDateKeysInRange('2026-09-24', '2026-09-27')).toEqual([
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ]);
  });

  it('uses the DST offset for the concrete Amsterdam date', () => {
    expect(
      localDateTimeToUtc(
        '2026-08-17',
        '17:00',
        'Europe/Amsterdam',
      )?.toISOString(),
    ).toBe('2026-08-17T15:00:00.000Z');
  });

  it('chooses the earlier occurrence when the clock moves backward', () => {
    expect(
      localDateTimeToUtc(
        '2026-10-25',
        '02:30',
        'Europe/Amsterdam',
      )?.toISOString(),
    ).toBe('2026-10-25T00:30:00.000Z');
  });

  it('skips a local time that does not exist', () => {
    expect(
      localDateTimeToUtc('2026-03-29', '02:30', 'Europe/Amsterdam'),
    ).toBeNull();
  });

  it('materializes recurring hours using the offset on each date', () => {
    const slots = materializeAvailabilitySlots(
      [
        {
          day: DaysInWeek.Monday,
          timeFrames: [{ from: '17:00', to: '18:00' }],
        },
      ],
      [],
      'Europe/Amsterdam',
      '2026-08-17',
      '2026-08-17',
      60,
    );

    expect(slots[0]?.start).toBe('2026-08-17T15:00:00.000Z');
  });

  it('lets a one-day unavailable override exclude one temporary date', () => {
    const slots = materializeAvailabilitySlots(
      [],
      [
        {
          id: 'temporary',
          type: AvailabilityOverrideType.Temporary,
          startDate: '2026-09-21',
          endDate: '2026-09-25',
          timezone: 'Asia/Manila',
          timeFrames: [{ from: '09:00', to: '10:00' }],
        },
        {
          id: 'unavailable-date',
          type: AvailabilityOverrideType.Unavailable,
          startDate: '2026-09-23',
          endDate: '2026-09-23',
          timezone: 'Asia/Manila',
          timeFrames: [],
        },
      ],
      'Asia/Manila',
      '2026-09-21',
      '2026-09-25',
      60,
    );

    expect(slots).toHaveLength(4);
    expect(slots.some((slot) => slot.start.startsWith('2026-09-23'))).toBe(
      false,
    );
  });

  it('lets one date keep only the remaining temporary time frames', () => {
    const slots = materializeAvailabilitySlots(
      [],
      [
        {
          id: 'temporary',
          type: AvailabilityOverrideType.Temporary,
          startDate: '2026-09-21',
          endDate: '2026-09-22',
          timezone: 'Asia/Manila',
          timeFrames: [
            { from: '09:00', to: '10:00' },
            { from: '10:00', to: '11:00' },
          ],
        },
        {
          id: 'custom-date',
          type: AvailabilityOverrideType.CustomHours,
          startDate: '2026-09-21',
          endDate: '2026-09-21',
          timezone: 'Asia/Manila',
          timeFrames: [{ from: '10:00', to: '11:00' }],
        },
      ],
      'Asia/Manila',
      '2026-09-21',
      '2026-09-22',
      60,
    );

    expect(slots).toHaveLength(3);
    expect(
      slots.filter((slot) => slot.start.startsWith('2026-09-21')),
    ).toHaveLength(1);
    expect(
      slots.filter((slot) => slot.start.startsWith('2026-09-22')),
    ).toHaveLength(2);
  });

  it('excludes one date without removing the rest of a temporary range', () => {
    const slots = materializeAvailabilitySlots(
      [],
      [
        {
          id: 'temporary',
          type: AvailabilityOverrideType.Temporary,
          startDate: '2026-09-21',
          endDate: '2026-09-23',
          timezone: 'Asia/Manila',
          timeFrames: [{ from: '09:00', to: '10:00' }],
          excludedDates: ['2026-09-22'],
        },
      ],
      'Asia/Manila',
      '2026-09-21',
      '2026-09-23',
      60,
    );

    expect(slots).toHaveLength(2);
  });
});
