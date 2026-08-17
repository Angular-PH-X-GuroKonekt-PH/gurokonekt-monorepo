export const APP_ROUTES = {
  ROOT: '',
  LOGIN: 'login',
  FORGOT_PASSWORD: 'forgot-password',
  // Must match REDIRECT_LINKS.RESET_PASSWORD in @gurokonekt/models — the API
  // builds the Supabase recovery redirect from the request origin plus that path.
  RESET_PASSWORD: 'reset-password',
  DASHBOARD: 'dashboard',
  MENTOR_MANAGEMENT: 'mentor-management',
  MENTEE_MANAGEMENT: 'mentee-management',
  BOOKING_MANAGEMENT: 'booking-management',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  USER_INQUIRIES: 'user-inquiries',
  ADMIN_ROLES: 'admin-roles',
} as const;
