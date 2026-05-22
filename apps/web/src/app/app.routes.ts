import { Route } from '@angular/router';

import { APP_ROUTES } from './shared/constants/routes';
import { dashboardAccessGuard } from './shared/guards/dashboard-access.guard';
import { profileSetupAccessGuard } from './shared/guards/profile-setup-access.guard';
import { unauthenticatedGuard } from './shared/guards/unauthenticated.guard';
import { mentorRegistrationConfirmationGuard } from './shared/guards/mentor-registration-confirmation.guard';
import { menteeCanMatch } from './shared/guards/mentee-can-match.guard';
import { mentorCanMatch } from './shared/guards/mentor-can-match.guard';
import { Layout } from './layouts/layout';

export const appRoutes: Route[] = [

  // Public routes
  {
    path: APP_ROUTES.REGISTER,
    canActivate: [unauthenticatedGuard],
    loadComponent: () =>
      import('./core/auth/pages/registration-page/registration-container/registration-container.component').then(
        (m) => m.RegistrationContainer
      ),
    title: 'Register',
  },
  {
    path: APP_ROUTES.LOGIN,
    canActivate: [unauthenticatedGuard],
    loadComponent: () => import('./core/auth/pages/login-page/login.page').then((m) => m.LoginPage),
    title: 'Login',
  },
  {
    path: APP_ROUTES.REGISTER_MENTOR_CONFIRMATION,
    canActivate: [unauthenticatedGuard, mentorRegistrationConfirmationGuard],
    loadComponent: () =>
      import(
        './core/auth/pages/registration-page/registration-mentor-confirmation-page/registration-mentor-confirmation.page'
      ).then((m) => m.RegistrationMentorConfirmationPage),
    title: 'Mentor Registration Confirmation',
  },

  // profile-setup — mentee sees MenteePostLoginPage, mentor sees MentorPostLoginPage
  {
    path: APP_ROUTES.PROFILE_SETUP,
    canMatch: [menteeCanMatch],
    canActivate: [profileSetupAccessGuard],
    loadComponent: () =>
      import('./features/mentee/pages/mentee-post-login-page/mentee-post-login.page').then(
        (m) => m.MenteePostLoginPage
      ),
    title: 'Complete Your Profile',
  },
  {
    path: APP_ROUTES.PROFILE_SETUP,
    canMatch: [mentorCanMatch],
    canActivate: [profileSetupAccessGuard],
    loadComponent: () =>
      import('./features/mentor/pages/mentor-post-login-page/mentor-post-login.page').then(
        (m) => m.MentorPostLoginPage
      ),
    title: 'Complete Your Mentor Profile',
  },

  // MENTEE ROUTES
  {
    path: '',
    canMatch: [menteeCanMatch],
    canActivate: [dashboardAccessGuard],
    component: Layout,
    children: [
      {
        path: APP_ROUTES.DASHBOARD,
        loadComponent: () =>
          import('./features/mentee/pages/mentee-dashboard-page/mentee-dashboard.page').then(
            (m) => m.MenteeDashboardPage
          ),
        title: 'Dashboard',
      },
           {
        path: APP_ROUTES.FIND_MENTORS,
        loadComponent: () =>
          import('./features/mentee/pages/mentee-find-mentors-page/mentee-find-mentors.page').then(
            (m) => m.MenteeFindMentorsPage
          ),
        title: 'Find Mentors',
      },
      {
        path: APP_ROUTES.BOOKING_OVERVIEW,
        loadComponent: () =>
          import('./features/mentee/pages/mentee-booking-overview-page/mentee-booking-overview.page').then(
            (m) => m.MenteeBookingOverviewPage
          ),
        title: 'Booking Overview',
      },
      {
        path: APP_ROUTES.NOTIFICATIONS,
        loadComponent: () =>
          import('./shared/components/notifications/notifications.component').then(
            (m) => m.Notifications
          ),
        title: 'Notifications',
      },
    ],
  },
  // MENTOR ROUTES
  {
    path: '',
    canMatch: [mentorCanMatch],
    canActivate: [dashboardAccessGuard],
    component: Layout,
    children: [
      {
        path: APP_ROUTES.DASHBOARD,
        loadComponent: () =>
          import('./features/mentor/pages/mentor-dashboard-page/mentor-dashboard.page').then(
            (m) => m.MentorDashboardPage
          ),
        title: 'Dashboard',
      },
      {
        path: APP_ROUTES.BOOKING_OVERVIEW,
        loadComponent: () =>
          import('./features/mentor/pages/mentor-booking-overview-page/mentor-booking-overview.page').then(
            (m) => m.MentorBookingOverviewPage
          ),
        title: 'Booking Overview',
      },
      {
        path: APP_ROUTES.MANAGE_AVAILABILITY,
        loadComponent: () =>
          import('./features/mentor/pages/mentor-manage-availability-page/mentor-manage-availability.page').then(
            (m) => m.MentorManageAvailabilityPage
          ),
        title: 'Manage Availability',
      },      
      {
        path: APP_ROUTES.NOTIFICATIONS,
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
