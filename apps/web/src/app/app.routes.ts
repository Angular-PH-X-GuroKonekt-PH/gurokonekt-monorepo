import { Route } from '@angular/router';

import { APP_ROUTES } from './shared/constants/routes';
import { dashboardAccessGuard } from './shared/guards/dashboard-access.guard';
import { profileSetupAccessGuard } from './shared/guards/profile-setup-access.guard';
import { unauthenticatedGuard } from './shared/guards/unauthenticated.guard';
import { menteeCanMatch } from './shared/guards/mentee-can-match.guard';
import { mentorCanMatch } from './shared/guards/mentor-can-match.guard';
import { MenteeLayout } from './layouts/mentee-layout/mentee.layout';
import { MentorLayout } from './layouts/mentor-layout/mentor.layout';

export const appRoutes: Route[] = [
  {
    path: APP_ROUTES.REGISTER.replace('/', ''),
    canActivate: [unauthenticatedGuard],
    loadComponent: () =>
      import('./core/auth/pages/registration-page/registration-container/registration-container.component').then(
        (m) => m.RegistrationContainer
      ),
    title: 'Register',
  },
  {
    path: APP_ROUTES.LOGIN.replace('/', ''),
    canActivate: [unauthenticatedGuard],
    loadComponent: () => import('./core/auth/pages/login-page/login.page').then((m) => m.LoginPage),
    title: 'Login',
  },

  // /profile-setup — mentee sees MenteePostLoginPage, mentor sees MentorPostLoginPage
  {
    path: APP_ROUTES.PROFILE_SETUP.replace('/', ''),
    canMatch: [menteeCanMatch],
    canActivate: [profileSetupAccessGuard],
    loadComponent: () =>
      import('./features/mentee/pages/mentee-post-login-page/mentee-post-login.page').then(
        (m) => m.MenteePostLoginPage
      ),
    title: 'Complete Your Profile',
  },
  {
    path: APP_ROUTES.PROFILE_SETUP.replace('/', ''),
    canMatch: [mentorCanMatch],
    canActivate: [profileSetupAccessGuard],
    loadComponent: () =>
      import('./features/mentor/pages/mentor-post-login-page/mentor-post-login.page').then(
        (m) => m.MentorPostLoginPage
      ),
    title: 'Complete Your Mentor Profile',
  },

  // /dashboard — mentee role uses MenteeLayout
  {
    path: APP_ROUTES.DASHBOARD.replace('/', ''),
    canMatch: [menteeCanMatch],
    canActivate: [dashboardAccessGuard],
    component: MenteeLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/mentee/pages/mentee-dashboard-page/mentee-dashboard.page').then(
            (m) => m.MenteeDashboardPage
          ),
        title: 'Dashboard',
      },
    ],
  },
  // /dashboard — mentor role uses MentorLayout
  {
    path: APP_ROUTES.DASHBOARD.replace('/', ''),
    canMatch: [mentorCanMatch],
    canActivate: [dashboardAccessGuard],
    component: MentorLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/mentor/pages/mentor-dashboard-page/mentor-dashboard.page').then(
            (m) => m.MentorDashboardPage
          ),
        title: 'Dashboard',
      },
    ],
  },

  // Mentee-only sub-pages — no /mentee/ prefix
  {
    path: '',
    canMatch: [menteeCanMatch],
    canActivate: [dashboardAccessGuard],
    component: MenteeLayout,
    children: [
      {
        path: APP_ROUTES.FIND_MENTORS.replace('/', ''),
        loadComponent: () =>
          import('./features/mentee/pages/mentee-find-mentors-page/mentee-find-mentors.page').then(
            (m) => m.MenteeFindMentorsPage
          ),
        title: 'Find Mentors',
      },
      {
        path: APP_ROUTES.BOOKING_OVERVIEW.replace('/', ''),
        loadComponent: () =>
          import('./features/mentee/pages/mentee-booking-overview-page/mentee-booking-overview.page').then(
            (m) => m.MenteeBookingOverviewPage
          ),
        title: 'Booking Overview',
      },
      {
        path: APP_ROUTES.NOTIFICATIONS.replace('/', ''),
        loadComponent: () =>
          import('./shared/components/notifications/notifications.component').then(
            (m) => m.Notifications
          ),
        title: 'Notifications',
      },
    ],
  },
  // Mentor-only sub-pages
  {
    path: '',
    canMatch: [mentorCanMatch],
    canActivate: [dashboardAccessGuard],
    component: MentorLayout,
    children: [
      {
        path: APP_ROUTES.NOTIFICATIONS.replace('/', ''),
        loadComponent: () =>
          import('./shared/components/notifications/notifications.component').then(
            (m) => m.Notifications
          ),
        title: 'Notifications',
      },
    ],
  },

  {
    path: APP_ROUTES.SETTINGS.replace('/', ''),
    canActivate: [dashboardAccessGuard],
    loadComponent: () =>
      import('./core/profile/pages/profile-settings-page/profile-settings.page').then(
        (m) => m.ProfileSettingsPageComponent
      ),
    title: 'Profile Settings',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./core/profile/pages/profile-overview-section-page/profile-overview-section.page').then(
            (m) => m.ProfileOverviewSectionPage
          ),
        title: 'Overview Section',
      },
    ],
  },
  {
    path: APP_ROUTES.ROOT,
    pathMatch: 'full',
    redirectTo: APP_ROUTES.LOGIN.replace('/', ''),
  },
];
