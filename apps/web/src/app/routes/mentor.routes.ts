import { Route } from '@angular/router';
import { dashboardAccessGuard } from '../guards/dashboard-access.guard';

export const MENTOR_ROUTES: Route[] = [
  {
    path: '',
    canActivate: [dashboardAccessGuard],
    loadComponent: () =>
      import('../components/layouts/mentor-lyout/mentor-layout').then(
        (m) => m.MentorLayout
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
          import('../components/mentor/dashboard/mentor-dashboard').then(
            (m) => m.MentorDashboard
          ),
        title: 'Mentor Dashboard',
      },      
      {
        path: 'my-booking',
        loadComponent: () =>
          import('../components/mentor/my-booking/my-booking').then(
            (m) => m.MyBooking
          ),
        title: 'My Booking',
      },      
      {
        path: 'availability',
        loadComponent: () =>
          import('../components/mentor/availability/availability').then(
            (m) => m.Availability
          ),
        title: 'Availability',
      },
      {
        path: 'profile-settings',
        loadComponent: () =>
          import('../components/mentor/profile-settings/profile-settings').then(
            (m) => m.ProfileSettingsComponent
          ),
        title: 'Profile Settings',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('../components/mentor/notifications/mentor-notifications').then(
            (m) => m.MentorNotifications
          ),
        title: 'Notifications',
      },      
    ],
  },
];
