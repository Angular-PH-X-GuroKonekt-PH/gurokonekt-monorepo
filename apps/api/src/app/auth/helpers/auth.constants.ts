/**
 * Auth service constants and configuration
 * Centralized for easier maintenance and testing
 */

import { UserRole } from '@gurokonekt/models';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const SIGN_IN_COUNT_WINDOW_MS = 24 * HOUR_MS;
const SIGN_IN_LOCKOUT_MESSAGE =
  'Too many failed login attempts. Try again in {duration}, or reset your password to regain access now.';

export const AUTH_TIME_LIMITS = {
  PASSWORD_CHANGE_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes
  RESET_PIN_EXPIRY_MS: 20 * 60 * 1000, // 20 minutes
  PASSWORD_HASH_ROUNDS: 10,
};

export const AUTH_RATE_LIMITS = {
  RESEND_EMAIL: {
    maxAttemptsPerDay: 3,
    minIntervalSeconds: 60,
    timeWindowMs: 86400000, // 24 hours
  },
  /**
   * Default sign-in lockout for mentees and mentors: one flat 24-hour block
   * after 5 failures, expressed as a single tier so both policies run through
   * the same checker. A successful sign-in or a completed password reset
   * clears the count outright (see `resetActionTypes` in the sign-in check).
   */
  SIGN_IN: {
    countWindowMs: SIGN_IN_COUNT_WINDOW_MS,
    tiers: [{ attempts: 5, lockoutMs: 24 * HOUR_MS }],
    lockoutMessageTemplate: SIGN_IN_LOCKOUT_MESSAGE,
  },
  /**
   * Admins get a progressive lockout instead. Admin addresses are both
   * high-value and easy to guess, so a flat day-long block on 5 failures
   * hands an attacker a cheap way to lock the whole team out of the portal.
   * Escalating from 15 minutes keeps brute force throttled while leaving a
   * mistyped password recoverable within the hour.
   */
  SIGN_IN_ADMIN: {
    countWindowMs: SIGN_IN_COUNT_WINDOW_MS,
    tiers: [
      { attempts: 5, lockoutMs: 15 * MINUTE_MS },
      { attempts: 10, lockoutMs: HOUR_MS },
      { attempts: 15, lockoutMs: 24 * HOUR_MS },
    ],
    lockoutMessageTemplate: SIGN_IN_LOCKOUT_MESSAGE,
  },
  UPDATE_PASSWORD: {
    maxIncorrectAttemptsPerDay: 3,
  },
};

/**
 * Picks the sign-in lockout policy for a role. Anything that is not an admin —
 * including an email that matches no account — gets the flat policy, so the
 * lockout behaviour never depends on whether the address exists.
 */
export const signInRateLimitFor = (role?: string) =>
  role === UserRole.Admin ? AUTH_RATE_LIMITS.SIGN_IN_ADMIN : AUTH_RATE_LIMITS.SIGN_IN;

export const REGISTRATION_CONFIG = {
  MENTEE: {
    isProfileComplete: false,
    isMentorProfileComplete: false,
  },
  MENTOR: {
    isProfileComplete: false,
    isMentorProfileComplete: false,
  },
};
