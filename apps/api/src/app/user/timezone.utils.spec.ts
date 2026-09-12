import { DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';
import { localDateTimeToUtc, materializeAvailabilitySlots } from '@gurokonekt/utils';

describe('timezone availability utilities', () => {
  it('uses the DST offset for the concrete Amsterdam date', () => {
    expect(localDateTimeToUtc('2026-08-17', '17:00', 'Europe/Amsterdam')?.toISOString())
      .toBe('2026-08-17T15:00:00.000Z');
  });

  it('chooses the earlier occurrence when the clock moves backward', () => {
    expect(localDateTimeToUtc('2026-10-25', '02:30', 'Europe/Amsterdam')?.toISOString())
      .toBe('2026-10-25T00:30:00.000Z');
  });

  it('skips a local time that does not exist', () => {
    expect(localDateTimeToUtc('2026-03-29', '02:30', 'Europe/Amsterdam')).toBeNull();
  });

  it('materializes recurring hours using the offset on each date', () => {
    const slots = materializeAvailabilitySlots(
      [{ day: DaysInWeek.Monday, timeFrames: [{ from: '17:00', to: '18:00' }] }],
      [],
      'Europe/Amsterdam',
      '2026-08-17',
      '2026-08-17',
      60,
    );

    expect(slots[0]?.start).toBe('2026-08-17T15:00:00.000Z');
  });
});
