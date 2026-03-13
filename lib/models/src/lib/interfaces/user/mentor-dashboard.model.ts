export interface MentorQuickStatsInterface {
  pendingBookingRequestsCount: number;
  upcomingSessions: number;
  totalCompletedSessions: number;
}

export interface MentorDashboardShortcutInterface {
  label: string;
  route: string;
  icon: string;
}

export interface MentorDashboardNavItemInterface {
  label: string;
  route: string;
  icon: string;
}

export interface MentorDashboardInterface {
  greeting: string;
  quickStats: MentorQuickStatsInterface;
  shortcuts: MentorDashboardShortcutInterface[];
  navItems: MentorDashboardNavItemInterface[];
}
