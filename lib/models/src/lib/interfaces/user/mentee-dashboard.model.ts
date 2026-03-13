import { MentorSearchItemInterface } from '../search/search.model';

export interface MenteeSessionHistoryItem {
  id: string;
  mentorId: string;
  sessionDateTime: Date;
  status: string;
  sessionLink: string | null;
  notes: string | null;
  mentor: {
    id: string;
    firstName: string;
    lastName: string;
    avatarAttachments: { publicUrl: string }[];
  };
}

export interface MenteeDashboardWidgetsInterface {
  upcomingSessions: number;
  sessionHistory: MenteeSessionHistoryItem[];
  recommendedMentors: MentorSearchItemInterface[];
}

export interface MenteeDashboardInterface {
  greeting: string;
  summaryWidgets: MenteeDashboardWidgetsInterface;
  shortcuts: { label: string; route: string; icon: string }[];
  navItems: { label: string; route: string; icon: string }[];
}

export interface MenteeBookingOverviewInterface {
  total: number;
  upcoming: number;
  completed: number;
  pending: number;
}
