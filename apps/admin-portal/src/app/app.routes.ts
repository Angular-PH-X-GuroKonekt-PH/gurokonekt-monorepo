import { Route } from '@angular/router';
import { APP_ROUTES } from './shared/constants/routes';
import { authGuard } from './shared/guards/auth.guard';
import { unauthenticatedGuard } from './shared/guards/unauthenticated.guard';
import { Layout } from './layouts/layout';

export const appRoutes: Route[] = [
  {
    path: APP_ROUTES.LOGIN,
    canActivate: [unauthenticatedGuard],
    loadComponent: () =>
      import('./core/auth/pages/login-page/login.page').then((m) => m.LoginPage),
    title: 'Admin Login',
  },
  {
    path: '',
    canActivate: [authGuard],
    component: Layout,
    children: [
      {
        path: APP_ROUTES.DASHBOARD,
        loadComponent: () =>
          import('./features/dashboard/pages/admin-dashboard-page/admin-dashboard.page').then(
            (m) => m.AdminDashboardPage
          ),
        title: 'Dashboard',
      },
      {
        path: APP_ROUTES.MENTEE_MANAGEMENT,
        loadComponent: () =>
          import('./features/mentee-management/pages/mentee-management-page/mentee-management.page').then(
            (m) => m.MenteeManagementPage
          ),
        title: 'Mentee Management',
      },
      {
        path: APP_ROUTES.BOOKING_MANAGEMENT,
        loadComponent: () =>
          import('./features/booking-management/pages/booking-management-page/booking-management.page').then(
            (m) => m.BookingManagementPage
          ),
        title: 'Booking Management',
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: APP_ROUTES.DASHBOARD,
      },
    ],
  },
  {
    path: '**',
    redirectTo: APP_ROUTES.DASHBOARD,
  },
];
