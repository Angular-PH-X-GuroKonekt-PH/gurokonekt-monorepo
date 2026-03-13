export interface MenteeDashboardItem {
  label: string;
  route: string;
  icon: string;
}

export const MENTEE_DASHBOARD_SHORTCUTS: MenteeDashboardItem[] = [
  { label: 'Find Mentors',     route: '/search',           icon: 'search' },
  { label: 'Booking Overview', route: '/booking-overview', icon: 'calendar-check' },
  { label: 'Profile Settings', route: '/profile/settings', icon: 'user-cog' },
  { label: 'Notifications',    route: '/notifications',    icon: 'bell' },
];

export const MENTEE_DASHBOARD_NAV_ITEMS: MenteeDashboardItem[] = [
  { label: 'Dashboard',        route: '/dashboard',        icon: 'layout-dashboard' },
  { label: 'Find Mentors',     route: '/search',           icon: 'search' },
  { label: 'Booking Overview', route: '/booking-overview', icon: 'calendar-check' },
  { label: 'Notifications',    route: '/notifications',    icon: 'bell' },
  { label: 'Profile Settings', route: '/profile/settings', icon: 'user-cog' },
  { label: 'Logout',           route: '/logout',           icon: 'log-out' },
];
