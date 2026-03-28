import { Route } from '@angular/router';

import { APP_ROUTES } from './constants/routes';

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
		path: 'mentee',
		loadChildren: () => import('./routes/mentee.routes').then(m => m.MENTEE_ROUTES), 
  },
		{ 
		path: 'mentor', 
		loadChildren: () => import('./routes/mentor.routes').then(m => m.MENTOR_ROUTES)
	},
	{ 
		path: APP_ROUTES.ROOT, 
		pathMatch: 'full', 
		redirectTo: APP_ROUTES.LOGIN.replace('/', '') 
	},
];
