import { Route } from '@angular/router';

export const appRoutes: Route[] = [
    {
        path: 'home',
        loadComponent: () => import('./components/home/home').then(m => m.Home),
        title: 'Home'
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];
