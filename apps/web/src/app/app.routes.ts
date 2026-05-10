import { Route } from '@angular/router';

import { APP_ROUTES } from './shared/constants/routes';
import { dashboardAccessGuard } from './shared/guards/dashboard-access.guard';
import { unauthenticatedGuard } from './shared/guards/unauthenticated.guard';

export const appRoutes: Route[] = [
  {
    path: APP_ROUTES.REGISTER.replace('/', ''),
    canActivate: [unauthenticatedGuard],
    loadComponent: () =>
      import('./core/auth/pages/registration-page/registration-container/registration-container').then(
        (m) => m.RegistrationContainer
      ),
    title: 'Register',
  },
  {
    path: APP_ROUTES.LOGIN.replace('/', ''),
    canActivate: [unauthenticatedGuard],
    loadComponent: () => import('./core/auth/pages/login-page/login-page').then((m) => m.LoginPage),
    title: 'Login',
  },
  {
    path: APP_ROUTES.PROFILE_SETUP.replace('/', ''),
    loadComponent: () =>
      import('./features/mentee/pages/mentee-post-login-page/mentee-post-login-page').then(
        (m) => m.MenteePostLoginPage
      ),
    title: 'Complete Your Profile',
  },
  {
    path: APP_ROUTES.MENTOR_PROFILE_SETUP.replace('/', ''),
    loadComponent: () =>
      import('./features/mentor/pages/mentor-post-login-page/mentor-post-login-page').then(
        (m) => m.MentorPostLoginPage
      ),
    title: 'Complete Your Mentor Profile',
  },
  {
    path: 'mentee',
    loadChildren: () =>
      import('./routes/mentee.routes').then((m) => m.MENTEE_ROUTES),
  },
  {
    path: 'mentor',
    loadChildren: () =>
      import('./routes/mentor.routes').then((m) => m.MENTOR_ROUTES),
  },
  {
    path: APP_ROUTES.SETTINGS.replace('/', ''),
    canActivate: [dashboardAccessGuard],
    loadComponent: () =>
      import('./features/profile/pages/profile-settings-page/profile-settings-page').then(
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
          import('./features/profile/pages/profile-overview-section-page/profile-overview-section-page').then(
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
