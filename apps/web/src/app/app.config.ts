import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideStore } from '@ngxs/store';
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { withNgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';

import { appRoutes } from './app.routes';
import { AuthState } from './store/auth';
import { VerifyEmailState } from './store/verify-email';
import { RegistrationState } from './store/registration';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(
      [AuthState, VerifyEmailState, RegistrationState],
      withNgxsLoggerPlugin({ disabled: !isDevMode() }),
      withNgxsReduxDevtoolsPlugin({ disabled: !isDevMode() })
    ),
  ],
};
