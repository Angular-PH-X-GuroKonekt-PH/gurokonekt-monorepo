import {
  getAvailabilityOccurrences,
  getAvailabilityForDisplay,
} from './timezone.util';

describe('timezone utilities', () => {
  const mondayAmsterdam = {
    day: 'monday' as const,
    timezone: 'Europe/Amsterdam',
    timeFrames: [{ from: '06:00', to: '07:00' }],
  };

  it('converts a source availability into the browser timezone using DST rules', () => {
    const occurrences = getAvailabilityOccurrences(
      [mondayAmsterdam],
      'Asia/Singapore',
      'Asia/Manila',
      7,
      new Date('2026-06-14T00:00:00.000Z'),
    );

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].sourceTimezone).toBe('Europe/Amsterdam');
    expect(occurrences[0].start.toISOString()).toBe('2026-06-15T04:00:00.000Z');
    expect(occurrences[0].viewerStart).toMatchObject({
      year: 2026,
      month: 6,
      day: 15,
      hour: 12,
      minute: 0,
    });
    expect(occurrences[0].viewerEnd.hour).toBe(13);
  });

  it('keeps separate source timezones for separate availability entries', () => {
    const occurrences = getAvailabilityOccurrences(
      [
        mondayAmsterdam,
        {
          day: 'thursday',
          timezone: 'America/Sao_Paulo',
          timeFrames: [{ from: '09:00', to: '10:00' }],
        },
      ],
      'UTC',
      'Asia/Manila',
      7,
      new Date('2026-06-14T00:00:00.000Z'),
    );

    expect(occurrences.map((item) => item.sourceTimezone)).toEqual([
      'Europe/Amsterdam',
      'America/Sao_Paulo',
    ]);
    expect(occurrences[1].viewerStart).toMatchObject({
      day: 18,
      hour: 20,
      minute: 0,
    });
  });

  it('falls back to the mentor profile timezone when an entry has no timezone', () => {
    const [displayAvailability] = getAvailabilityForDisplay(
      [{ day: 'monday', timeFrames: [{ from: '09:00', to: '10:00' }] }],
      'Europe/Amsterdam',
    );

    expect(displayAvailability.timezone).toBe('Europe/Amsterdam');
  });
});
