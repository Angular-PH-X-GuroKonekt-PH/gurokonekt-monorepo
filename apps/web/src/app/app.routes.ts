import { Route } from '@angular/router';

import { APP_ROUTES } from './constants/routes';
import { dashboardAccessGuard } from './guards/dashboard-access.guard';

export const appRoutes: Route[] = [
	{ 
		path: APP_ROUTES.REGISTER.replace('/', ''),
		loadComponent: () => import('./components/registration-container/registration-container').then(m => m.RegistrationContainer),
		title: 'Register'
	},
	{ 
		path: APP_ROUTES.LOGIN.replace('/', ''), 
		loadComponent: () => import('./components/login/login').then(m => m.Login),
		title: 'Login'
	},
	{ 
		path: APP_ROUTES.VERIFY_EMAIL.replace('/', ''), 
		loadComponent: () => import('./components/verify-email/verify-email').then(m => m.VerifyEmail),
		title: 'Verify Email'
	},
	{ 
		path: APP_ROUTES.PROFILE_SETUP.replace('/', ''), 
		loadComponent: () => import('./components/mentee/post-login/post-login').then(m => m.PostLogin),
		title: 'Complete Your Profile'
	},
	{ 
		path: APP_ROUTES.DASHBOARD.replace('/', ''), 
		canActivate: [dashboardAccessGuard],
		loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard),
		title: 'Dashboard'
	},
	{ 
		path: APP_ROUTES.SETTINGS_PROFILE.replace('/', ''), 
		canActivate: [dashboardAccessGuard],
		loadComponent: () => import('./components/mentee/profile-settings/profile-settings').then(m => m.ProfileSettingsComponent),
		title: 'Profile Settings'
	},
	{ 
		path: APP_ROUTES.ROOT, 
		pathMatch: 'full', 
		redirectTo: APP_ROUTES.LOGIN.replace('/', '') 
	},
];
