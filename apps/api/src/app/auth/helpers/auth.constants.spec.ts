import { UserRole } from '@gurokonekt/models';
import { signInRateLimitFor } from './auth.constants';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe('signInRateLimitFor', () => {
  describe('admins', () => {
    it('gets progressive lockout tiers', () => {
      const tiers = signInRateLimitFor(UserRole.Admin).tiers;

      expect(tiers).toEqual([
        { attempts: 5, lockoutMs: 15 * 60 * 1000 },
        { attempts: 10, lockoutMs: HOUR },
        { attempts: 15, lockoutMs: DAY },
      ]);
    });
  });

  describe('everyone else', () => {
    it.each([UserRole.Mentee, UserRole.Mentor])(
      'keeps %s on a single flat 24-hour lockout',
      (role) => {
        expect(signInRateLimitFor(role).tiers).toEqual([{ attempts: 5, lockoutMs: DAY }]);
      }
    );

    it('falls back to the flat lockout when the email matches no account', () => {
      expect(signInRateLimitFor(undefined).tiers).toEqual([{ attempts: 5, lockoutMs: DAY }]);
    });

    it('falls back to the flat lockout for an unrecognised role', () => {
      expect(signInRateLimitFor('something-else').tiers).toEqual([
        { attempts: 5, lockoutMs: DAY },
      ]);
    });
  });

  it('counts failures over a rolling 24 hours for every role', () => {
    expect(signInRateLimitFor(UserRole.Admin).countWindowMs).toBe(DAY);
    expect(signInRateLimitFor(UserRole.Mentee).countWindowMs).toBe(DAY);
  });
});
