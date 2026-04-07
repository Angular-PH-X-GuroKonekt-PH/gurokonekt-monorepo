export const APP_ROUTES = {
  ROOT: '',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  PROFILE_SETUP: '/profile-setup',
  MENTOR_PROFILE_SETUP: '/mentor/profile-setup',
  DASHBOARD: '/dashboard',
  MENTOR_DASHBOARD: '/mentor/dashboard',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

export const SIDEBAR_PREFIX_ROUTES: readonly string[] = [
  APP_ROUTES.DASHBOARD,
  '/profile/',
  '/settings',
  '/mentoring',
] as const;
