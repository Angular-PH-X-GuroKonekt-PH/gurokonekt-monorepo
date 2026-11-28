import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AUTH_SETUP_REQUIRED_ERROR_CODE } from '@gurokonekt/models/interfaces/auth-requirements/auth-requirements.model';
import { AuthStorageService } from '../../storage/auth-storage.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constants';
import { APP_ROUTES } from '../../../shared/constants/routes';
import * as AuthActions from '../store/auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStorageService).getToken();
  const store = inject(Store);
  const router = inject(Router);

  // Don't trigger logout on the login request itself (a 401 there is bad
  // credentials, not an expired session) — avoids a redirect loop.
  const isLoginRequest = req.url.includes(API_ENDPOINTS.auth.login);

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isLoginRequest) {
        // Token expired/invalid — clear auth and redirect to login.
        store.dispatch(new AuthActions.Logout());
      } else if (err.status === 403 && err.error?.errorCode === AUTH_SETUP_REQUIRED_ERROR_CODE) {
        // A requirement was switched on mid-session (#463); the setup page re-reads the status.
        void router.navigate([APP_ROUTES.SECURITY_SETUP]);
      }
      return throwError(() => err);
    })
  );
};
