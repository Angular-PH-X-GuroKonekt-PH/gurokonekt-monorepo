export interface MentorQuickStatsInterface {
  pendingBookingRequestsCount: number;
  upcomingSessions: number;
  totalCompletedSessions: number;
}

export interface MentorUpcomingSessionInterface {
  title: string;
  menteeName: string;
  sessionDateTime: string;
  sessionLink: string | null;
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
  nextUpcomingSession: MentorUpcomingSessionInterface | null;
  shortcuts: MentorDashboardShortcutInterface[];
  navItems: MentorDashboardNavItemInterface[];
}
