import {
  splitAvailabilityFrame,
  validateAvailabilityFrames,
} from './availability-validation.util';

describe('splitAvailabilityFrame', () => {
  it('splits a range using the session duration', () => {
    expect(
      splitAvailabilityFrame({ from: '09:00', to: '12:00' }, 60)
    ).toEqual([
      { from: '09:00', to: '10:00' },
      { from: '10:00', to: '11:00' },
      { from: '11:00', to: '12:00' },
    ]);
  });

  it('keeps an invalid legacy range unchanged', () => {
    expect(
      splitAvailabilityFrame({ from: '09:00', to: '10:30' }, 60)
    ).toEqual([{ from: '09:00', to: '10:30' }]);
  });
});

describe('validateAvailabilityFrames', () => {
  it('accepts adjacent session frames', () => {
    expect(
      validateAvailabilityFrames(
        [
          { from: '09:00', to: '10:00' },
          { from: '10:00', to: '11:00' },
        ],
        60
      )
    ).toBeNull();
  });

  it('rejects overlapping frames', () => {
    expect(
      validateAvailabilityFrames(
        [
          { from: '09:00', to: '11:00' },
          { from: '10:00', to: '12:00' },
        ],
        60
      )
    ).toContain('overlaps');
  });

  it('rejects an invalid range', () => {
    expect(
      validateAvailabilityFrames([{ from: '11:00', to: '10:00' }], 60)
    ).toBe('Start time must be before end time.');
  });

  it('rejects a range that is not divisible by the session duration', () => {
    expect(
      validateAvailabilityFrames([{ from: '09:00', to: '10:30' }], 60)
    ).toBe('Time range must be divisible into 60-minute sessions.');
  });
});
