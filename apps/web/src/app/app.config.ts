import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngxs/store';
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { withNgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';
import { Store } from '@ngxs/store';
import { appRoutes } from './app.routes';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { AuthState } from './core/auth/store/auth.state';
import { RegistrationState } from './core/auth/store/registration.state';
import { VerifyEmailState } from './core/auth/store/verify-email.state';
import { AvailabilityState } from './core/availability/store/availability.state';
import { RestoreSession } from './core/auth/store/auth.actions';

function restoreSession(store: Store) {
  return () => store.dispatch(new RestoreSession());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(
      [AuthState, VerifyEmailState, RegistrationState, AvailabilityState],
      withNgxsLoggerPlugin({ disabled: !isDevMode() }),
      withNgxsReduxDevtoolsPlugin({ disabled: !isDevMode() })
    ),
    { provide: APP_INITIALIZER, useFactory: restoreSession, deps: [Store], multi: true },
  ],
};
