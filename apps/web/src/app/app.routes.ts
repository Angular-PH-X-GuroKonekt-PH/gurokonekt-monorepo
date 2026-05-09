import { Route } from '@angular/router';


import { APP_ROUTES } from './shared/constants/routes';
import { dashboardAccessGuard } from './shared/guards/dashboard-access.guard';

export const appRoutes: Route[] = [
  {
    path: APP_ROUTES.REGISTER.replace('/', ''),
    loadComponent: () =>
      import('./components/registration-container/registration-container').then(
        (m) => m.RegistrationContainer
      ),
    title: 'Register',
  },
  {
    path: APP_ROUTES.LOGIN.replace('/', ''),
    loadComponent: () => import('./components/login/login').then((m) => m.Login),
    title: 'Login',
  },
  {
    path: APP_ROUTES.VERIFY_EMAIL.replace('/', ''),
    loadComponent: () =>
      import('./components/verify-email/verify-email').then(
        (m) => m.VerifyEmail
      ),
    title: 'Verify Email',
  },
  {
    path: APP_ROUTES.PROFILE_SETUP.replace('/', ''),
    loadComponent: () =>
      import('./core/profile/pages/post-login-page/post-login-page').then(
        (m) => m.PostLoginPage
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
    path: APP_ROUTES.SETTINGS_PROFILE.replace('/', ''),
    canActivate: [dashboardAccessGuard],
    loadComponent: () =>
      import('./features/profile/pages/profile-settings-page/profile-settings-page').then(
        (m) => m.ProfileSettingsPageComponent
      ),
    title: 'Profile Settings',
  },
  {
    path: APP_ROUTES.ROOT,
    pathMatch: 'full',
    redirectTo: APP_ROUTES.LOGIN.replace('/', ''),
  },
];
