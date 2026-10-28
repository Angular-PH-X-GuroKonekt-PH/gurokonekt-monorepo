import { lastSignInAt } from './jwt-guard.strategy';

describe('lastSignInAt', () => {
  it('uses the latest sign-in from the amr claim', () => {
    expect(lastSignInAt([
      { timestamp: 1_791_461_000 },
      { timestamp: 1_791_461_784 },
    ])).toEqual(new Date(1_791_461_784 * 1000));
  });

  it('is null when the token carries no sign-in time', () => {
    expect(lastSignInAt(undefined)).toBeNull();
    expect(lastSignInAt([])).toBeNull();
    expect(lastSignInAt([{}])).toBeNull();
  });
});
