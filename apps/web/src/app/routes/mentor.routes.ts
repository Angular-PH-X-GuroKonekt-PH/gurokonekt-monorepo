import { Route } from '@angular/router';
import { dashboardAccessGuard } from '../shared/guards/dashboard-access.guard';

export const MENTOR_ROUTES: Route[] = [
  {
    path: '',
    canActivate: [dashboardAccessGuard],
    loadComponent: () =>
      import('../layouts/mentor-layout/mentor-layout').then(
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
          import('../features/mentor/pages/mentor-dashboard-page/mentor-dashboard-page').then(
            (m) => m.MentorDashboardPage
          ),
        title: 'Mentor Dashboard',
      },       
      {
        path: 'post-login',
        loadComponent: () =>
          import('../features/mentor/pages/mentor-post-login-page/mentor-post-login-page').then(
            (m) => m.MentorPostLoginPage
          ),
        title: 'Mentor Post Login',
      } 
    ],
  },
];
