import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{ 
		path: 'register',
		children: [
			{
				path: 'choose-role',
				loadComponent: () => import('./components/role-selection/role-selection').then(m => m.RoleSelection),
				title: 'Choose Role'
			},
			{
				path: 'mentee',
				loadComponent: () => import('./components/mentee/register/register').then(m => m.Register),
				title: 'Mentee Register'
			},
			{
				path: 'mentor',
				loadComponent: () => import('./components/mentor/register/register').then(m => m.MentorRegister),
				title: 'Mentor Register'
			}
		]
	},
	{ 
		path: 'login', 
		loadComponent: () => import('./components/login/login').then(m => m.Login),
		title: 'Login'
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
