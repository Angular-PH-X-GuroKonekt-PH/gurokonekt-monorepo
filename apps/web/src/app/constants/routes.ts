export const APP_ROUTES = {
  ROOT: '',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  PROFILE_SETUP: '/profile-setup',
  MENTEE_DASHBOARD: '/mentee/dashboard',
  FIND_MENTORS: '/mentee/find-mentors',
  MENTOR_DASHBOARD: '/mentor/dashboard',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

export const SIDEBAR_PREFIX_ROUTES: readonly string[] = [
  APP_ROUTES.MENTEE_DASHBOARD,
  '/profile/',
  '/settings',
  '/mentoring',
] as const;
