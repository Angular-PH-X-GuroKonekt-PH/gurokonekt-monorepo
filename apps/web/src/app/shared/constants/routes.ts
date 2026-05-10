export const APP_ROUTES = {
  ROOT: '',
  LOGIN: 'login',
  REGISTER: 'register',
  PROFILE_SETUP: 'profile-setup',
  DASHBOARD: 'dashboard',
  FIND_MENTORS: 'find-mentors',
  BOOKING_OVERVIEW: 'booking-overview',
  SETTINGS: 'settings',
  SETTINGS_OVERVIEW: 'settings/overview',
  NOTIFICATIONS: 'notifications',
} as const;

export const SIDEBAR_PREFIX_ROUTES: readonly string[] = [
  APP_ROUTES.DASHBOARD,
  '/profile/',
  APP_ROUTES.SETTINGS,
  '/mentoring',
] as const;
