import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, catchError, finalize, of, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthStorageService } from '../../storage/auth-storage.service';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../config/api.config';
import type { RefreshTokenApiResponse } from '../../../shared/interfaces/auth-api.interface';
import { SessionExpired } from '../store/auth.actions';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/utils/http-error.util';

const SESSION_EXPIRED_CODE = 'SESSION_EXPIRED';

const PUBLIC_AUTH_PATHS = [
  API_CONFIG.endpoints.auth.login,
  API_CONFIG.endpoints.auth.registerMentee,
  API_CONFIG.endpoints.auth.registerMentor,
  API_CONFIG.endpoints.auth.verifyEmail,
  API_CONFIG.endpoints.auth.resendConfirmation,
  API_CONFIG.endpoints.auth.refreshToken,
] as const;

let refreshInProgress: Observable<{ accessToken: string; refreshToken: string }> | null = null;

function isSessionExpired(error: HttpErrorResponse): boolean {
  return error.status === 401 && error.error?.errorCode === SESSION_EXPIRED_CODE;
}

function isPublicAuthRequest(url: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

function isRecoverableUnauthorized(
  error: HttpErrorResponse,
  reqUrl: string,
  hadToken: boolean
): boolean {
  if (error.status !== 401 || isPublicAuthRequest(reqUrl)) {
    return false;
  }

  return hadToken || isSessionExpired(error);
}

function refreshTokens(
  refreshHttp: HttpClient,
  storage: AuthStorageService,
  refreshToken: string
): Observable<{ accessToken: string; refreshToken: string }> {
  if (!refreshInProgress) {
    refreshInProgress = refreshHttp
      .post<RefreshTokenApiResponse>(
        buildApiUrl(API_CONFIG.endpoints.auth.refreshToken),
        { refreshToken }
      )
      .pipe(
        switchMap((response) => {
          if (!response.data?.accessToken || !response.data?.refreshToken) {
            return throwError(() => new Error(response.message || 'Token refresh failed'));
          }

          const tokens = {
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          };

          storage.setToken(tokens.accessToken);
          storage.setRefreshToken(tokens.refreshToken);

          return of(tokens);
        }),
        finalize(() => {
          refreshInProgress = null;
        }),
        shareReplay(1)
      );
  }

  return refreshInProgress;
}

function createSessionExpiredClientError(originalError: HttpErrorResponse) {
  return {
    message: SESSION_EXPIRED_MESSAGE,
    statusCode: 401,
    originalError,
  };
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(AuthStorageService);
  const store = inject(Store);
  const refreshHttp = new HttpClient(inject(HttpBackend));

  const token = storage.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isRecoverableUnauthorized(error, req.url, !!token)) {
        return throwError(() => error);
      }

      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        store.dispatch(new SessionExpired());
        return throwError(() => createSessionExpiredClientError(error));
      }

      return refreshTokens(refreshHttp, storage, refreshToken).pipe(
        switchMap(({ accessToken }) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${accessToken}` },
            })
          )
        ),
        catchError(() => {
          store.dispatch(new SessionExpired());
          return throwError(() => createSessionExpiredClientError(error));
        })
      );
    })
  );
};
