import { Route } from '@angular/router';

export const appRoutes: Route[] = [
    {
        path: 'home',
        loadComponent: () => import('./components/home/home').then(m => m.Home),
        title: 'Home'
    },
    {
        path: 'mission',
        loadComponent: () => import('./components/mission/mission').then(m => m.Mission),
        title: 'Mission of GuroKonekt'
    },
    {
        path: 'privacy-policy',
        loadComponent: () => import('./components/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy),
        title: 'Privacy Policy'
    },
    {
        path: 'terms-and-conditions',
        loadComponent: () => import('./components/terms-and-conditions/terms-and-conditions').then(m => m.TermsAndConditions),
        title: 'Terms and Conditions'
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];
