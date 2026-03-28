import { Route } from '@angular/router';
import { dashboardAccessGuard } from '../guards/dashboard-access.guard';

export const MENTEE_ROUTES: Route[] = [
   {
    path: '',
    canActivate: [dashboardAccessGuard],
    loadComponent: () =>
      import('../components/layouts/mentee-lyout/mentee-layout').then(
        (m) => m.MenteeLayout
      ),
    children: [
      {
        path: '',
       loadComponent: () =>
      import('../components/layouts/mentee-lyout/mentee-layout').then(
        (m) => m.MenteeLayout
      ),
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../components/mentee/dashboard/mentee-dashboard').then(
            (m) => m.MenteeDashboard
          ),
        title: 'Mentee Dashboard',
      },
      {
        path: 'find-mentors',
        loadComponent: () =>
          import('../components/mentee/find-mentors/find-mentors').then(
            (m) => m.FindMentors
          ),
        title: 'Find Mentors',
      },
      {
        path: 'booking-overview',
        loadComponent: () =>
          import('../components/mentee/booking-overview/booking-overview').then(
            (m) => m.BookingOverview
          ),
        title: 'Booking Overview',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('../components/shared/notifications/notifications').then(
            (m) => m.Notifications
          ),
        title: 'Notifications',
      },
      {
        path: 'profile-settings',
        loadComponent: () =>
          import('../components/mentee/profile-settings/profile-settings').then(
            (m) => m.ProfileSettings
          ),
        title: 'Profile Settings',
      }
    ],
    
  },
];