import { Route } from '@angular/router';
import { dashboardAccessGuard } from '../guards/dashboard-access.guard';

export const MENTOR_ROUTES: Route[] = [
  {
    path: 'dashboard',
    canActivate: [dashboardAccessGuard],
    loadComponent: () =>
      import('../components/mentor/dashboard/dashboard')
        .then(m => m.MentorDashboard),
  },
];