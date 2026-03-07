export interface MentorDashboardItem {
  label: string;
  route: string;
  icon: string;
}

export const MENTOR_DASHBOARD_SHORTCUTS: MentorDashboardItem[] = [
  { label: 'Manage Availability', route: '/availability', icon: 'calendar' },
  { label: 'View Bookings',       route: '/bookings',     icon: 'book-open' },
  { label: 'Edit Profile',        route: '/profile/edit', icon: 'user-edit' },
  { label: 'Notifications',       route: '/notifications', icon: 'bell' },
];

export const MENTOR_DASHBOARD_NAV_ITEMS: MentorDashboardItem[] = [
  { label: 'Dashboard Overview', route: '/dashboard',     icon: 'layout-dashboard' },
  { label: 'My Bookings',        route: '/bookings',      icon: 'book-open' },
  { label: 'Availability',       route: '/availability',  icon: 'calendar' },
  { label: 'Profile',            route: '/profile',       icon: 'user' },
  { label: 'Notifications',      route: '/notifications', icon: 'bell' },
  { label: 'Logout',             route: '/logout',        icon: 'log-out' },
];
