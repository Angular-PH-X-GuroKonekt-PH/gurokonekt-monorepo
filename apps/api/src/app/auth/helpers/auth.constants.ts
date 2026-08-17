/**
 * Auth service constants and configuration
 * Centralized for easier maintenance and testing
 */

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
   * Progressive lockout. A mistyped password costs 15 minutes; sustained
   * brute force escalates to a day. Keeping the first tier short means an
   * attacker cannot cheaply lock a known admin address out for 24 hours,
   * while a successful sign-in or completed password reset clears the count
   * outright (see `resetActionTypes` in the sign-in check).
   */
  SIGN_IN: {
    countWindowMs: 86400000, // failures are counted over a rolling 24 hours
    tiers: [
      { attempts: 5, lockoutMs: 15 * 60 * 1000 }, // 15 minutes
      { attempts: 10, lockoutMs: 60 * 60 * 1000 }, // 1 hour
      { attempts: 15, lockoutMs: 24 * 60 * 60 * 1000 }, // 24 hours
    ],
    lockoutMessageTemplate:
      'Too many failed login attempts. Try again in {duration}, or reset your password to regain access now.',
  },
  UPDATE_PASSWORD: {
    maxIncorrectAttemptsPerDay: 3,
  },
};

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
