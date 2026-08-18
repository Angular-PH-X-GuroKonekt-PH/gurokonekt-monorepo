import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
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
import { isTokenExpired } from '../../../shared/utils/jwt.util';

const SESSION_EXPIRED_CODE = 'SESSION_EXPIRED';

const PUBLIC_AUTH_PATHS = [
  API_CONFIG.endpoints.auth.login,
  API_CONFIG.endpoints.auth.registerMentee,
  API_CONFIG.endpoints.auth.registerMentor,
  API_CONFIG.endpoints.auth.verifyEmail,
  API_CONFIG.endpoints.auth.resendConfirmation,
  API_CONFIG.endpoints.auth.refreshToken,
  API_CONFIG.endpoints.auth.forgotPassword,
  API_CONFIG.endpoints.auth.completePasswordReset,
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

function createExpiredBeforeSendError(url: string) {
  return {
    message: SESSION_EXPIRED_MESSAGE,
    statusCode: 401,
    errorCode: SESSION_EXPIRED_CODE,
    url,
  };
}

function isSessionExpiredClientError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    (error as { errorCode?: string }).errorCode === SESSION_EXPIRED_CODE
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(AuthStorageService);
  const store = inject(Store);
  const refreshHttp = new HttpClient(inject(HttpBackend));

  const token = storage.getToken();

  const send = (bearer: string | null): Observable<HttpEvent<unknown>> => {
    const authReq = bearer
      ? req.clone({ setHeaders: { Authorization: `Bearer ${bearer}` } })
      : req;

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!isRecoverableUnauthorized(error, req.url, !!bearer)) {
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

  // A token that has provably expired must never be spent on a request. On a
  // multipart upload the server's 401 can be lost when the stream is torn down
  // mid-body, and the client is left with a bare `status 0` it cannot act on
  // (issue #395). Refresh first, and fail loudly if that is not possible.
  const mustRefreshFirst =
    !!token && !isPublicAuthRequest(req.url) && isTokenExpired(token);

  if (!mustRefreshFirst) {
    return send(token);
  }

  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) {
    store.dispatch(new SessionExpired());
    return throwError(() => createExpiredBeforeSendError(req.url));
  }

  return refreshTokens(refreshHttp, storage, refreshToken).pipe(
    switchMap(({ accessToken }) => send(accessToken)),
    catchError((error) => {
      if (isSessionExpiredClientError(error)) {
        return throwError(() => error);
      }
      store.dispatch(new SessionExpired());
      return throwError(() => createExpiredBeforeSendError(req.url));
    })
  );
};
