import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{ 
		path: 'register',
		loadComponent: () => import('./components/registration-container/registration-container').then(m => m.RegistrationContainer),
		title: 'Register'
	},
	{ 
		path: 'login', 
		loadComponent: () => import('./components/login/login').then(m => m.Login),
		title: 'Login'
	},
	{ 
		path: 'verify-email', 
		loadComponent: () => import('./components/verify-email/verify-email').then(m => m.VerifyEmail),
		title: 'Verify Email'
	},
	{ 
		path: 'dashboard', 
		loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard),
		title: 'Dashboard'
	},
	{ 
		path: '', 
		pathMatch: 'full', 
		redirectTo: 'login' 
	},
];
