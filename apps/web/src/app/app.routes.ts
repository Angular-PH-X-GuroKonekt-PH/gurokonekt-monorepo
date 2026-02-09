import { Route } from '@angular/router';
import { Dashboard } from './components/mentee/dashboard/dashboard';
import { RoleSelection } from './components/role-selection/role-selection';
import { Register } from './components/mentee/register/register';
import { Login } from './components/login/login';
import { MentorRegister } from './components/mentor/register/register';

export const appRoutes: Route[] = [
	{ path: 'choose-role', component: RoleSelection },
	{ path: 'register', component: Register },
	{ path: 'mentor/register', component: MentorRegister },
	{ path: 'login', component: Login },
	{ path: 'dashboard', component: Dashboard },
	{ path: '', pathMatch: 'full', redirectTo: 'choose-role' },
];
