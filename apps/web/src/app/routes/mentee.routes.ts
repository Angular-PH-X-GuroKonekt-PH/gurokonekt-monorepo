import { Route } from '@angular/router';
import { dashboardAccessGuard } from '../shared/guards/dashboard-access.guard';

export const MENTEE_ROUTES: Route[] = [
  {
    path: '',
    canActivate: [dashboardAccessGuard],
    loadComponent: () =>
      import('../layouts/mentee-layout/mentee-layout').then(
        (m) => m.MenteeLayout
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../features/mentee/pages/mentee-dashboard-page/mentee-dashboard-page').then(
            (m) => m.MenteeDashboardPage
          ),
        title: 'Mentee Dashboard',
      },
      {
        path: 'find-mentors',
        loadComponent: () =>
          import('../features/mentee/pages/mentee-find-mentors-page/mentee-find-mentors-page').then(
            (m) => m.MenteeFindMentorsPage
          ),
        title: 'Find Mentors',
      },
      {
        path: 'booking-overview',
        loadComponent: () =>
          import('../features/mentee/pages/mentee-booking-overview-page/mentee-booking-overview.page').then(
            (m) => m.MenteeBookingOverviewPage
          ),
        title: 'Booking Overview',
      },
    ],
  },
];