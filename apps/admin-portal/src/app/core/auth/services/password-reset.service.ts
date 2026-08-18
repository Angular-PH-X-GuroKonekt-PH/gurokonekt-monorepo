import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export interface CompleteResetInput {
  accessToken: string;
  newPassword: string;
}

/**
 * Link-based password recovery for admins, sharing the web app's flow so both
 * portals use Supabase's Reset Password email template rather than Magic Link.
 *
 * This is also the way back in for an account locked out by repeated failed
 * sign-ins: completing a reset proves mailbox control and clears the lockout
 * counter server-side.
 */
@Injectable({ providedIn: 'root' })
export class PasswordResetService {
  private readonly http = inject(HttpClient);

  /** Step 1 — emails a recovery link to the account holder. */
  requestReset(email: string): Observable<string> {
    return this.http
      .post<ApiResponse<null>>(buildApiUrl(API_CONFIG.endpoints.auth.forgotPassword), { email })
      .pipe(
        map((response) => response.message),
        catchError(this.handleError)
      );
  }

  /** Step 2 — applies the new password using the token from the emailed link. */
  completeReset({ accessToken, newPassword }: CompleteResetInput): Observable<string> {
    return this.http
      .post<ApiResponse<null>>(buildApiUrl(API_CONFIG.endpoints.auth.completePasswordReset), {
        accessToken,
        newPassword,
        confirmPassword: newPassword,
      })
      .pipe(
        map((response) => response.message),
        catchError(this.handleError)
      );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const message = error.error?.message ?? 'An unexpected error occurred. Please try again.';
    return throwError(() => ({ message, originalError: error }));
  };
}
