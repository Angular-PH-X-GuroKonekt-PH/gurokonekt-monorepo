export const APP_ROUTES = {
  ROOT: '',
  LOGIN: 'login',
  REGISTER: 'register',
  REGISTER_MENTOR_CONFIRMATION: 'register/mentor/confirmation',
  REGISTER_MENTEE_CONFIRMATION: 'register/mentee/confirmation',
  VERIFY_EMAIL: 'verify-email',
  VERIFY_EMAIL_SUCCESS: 'verify-email/success',
  VERIFY_EMAIL_EXPIRED: 'verify-email/expired',
  VERIFY_EMAIL_ALREADY_VERIFIED: 'verify-email/already-verified',
  PROFILE_SETUP: 'profile-setup',
  DASHBOARD: 'dashboard',
  FIND_MENTORS: 'find-mentors',
  BOOKING_OVERVIEW: 'booking-overview',
  SETTINGS: 'settings',
  SETTINGS_OVERVIEW: 'settings/overview',
  NOTIFICATIONS: 'notifications',
  MANAGE_AVAILABILITY: 'manage-availability',
} as const;

export const SIDEBAR_PREFIX_ROUTES: readonly string[] = [
  APP_ROUTES.DASHBOARD,
  '/profile/',
  APP_ROUTES.SETTINGS,
  '/mentoring',
] as const;
