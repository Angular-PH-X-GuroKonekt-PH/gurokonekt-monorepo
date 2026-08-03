import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { APP_CONFIG } from '../environments/app-config.token';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    // withFetch() so HttpClient works under the Node prerender build, where the
    // default XHR backend is unavailable.
    provideHttpClient(withFetch()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    { provide: APP_CONFIG, useValue: environment },
  ],
};
