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
  SIGN_IN: {
    maxAttemptsPerDay: 5,
    timeWindowMs: 86400000, // 24 hours
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
