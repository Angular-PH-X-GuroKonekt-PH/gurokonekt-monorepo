export const APP_ROUTES = {
  ROOT: '',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  PROFILE_SETUP: '/profile-setup',
  MENTOR_PROFILE_SETUP: '/mentor/profile-setup',
  DASHBOARD: '/dashboard',
  MENTOR_DASHBOARD: '/mentor/dashboard',
  SETTINGS: '/settings',
  SETTINGS_OVERVIEW: '/settings/overview',
  FORGOT_PASSWORD: '/forgot-password',
  SETTINGS_PROFILE: '/settings/profile',
} as const;

export const SIDEBAR_PREFIX_ROUTES: readonly string[] = [
  APP_ROUTES.DASHBOARD,
  APP_ROUTES.MENTOR_DASHBOARD,
  '/profile/',
  APP_ROUTES.SETTINGS,
  '/mentoring',
] as const;
