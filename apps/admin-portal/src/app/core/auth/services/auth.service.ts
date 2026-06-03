import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../config/api.config';
import { AdminUser } from '../../storage/auth-storage.service';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

interface LoginResponseData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  session: {
    access_token: string;
  };
}

export interface AuthResponse {
  user: AdminUser;
  accessToken: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<ApiResponse<LoginResponseData>>(
      buildApiUrl(API_CONFIG.endpoints.auth.login),
      credentials
    ).pipe(
      map((response) => {
        if (!response.data?.user || !response.data?.session) {
          throw new Error(response.message || 'Login failed');
        }

        return {
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            role: response.data.user.role,
            firstName: response.data.user.firstName,
            lastName: response.data.user.lastName,
          },
          accessToken: response.data.session.access_token,
          message: response.message,
        };
      }),
      catchError(this.handleError)
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const serverMessage = error.error?.message;
    let message = 'An unexpected error occurred. Please try again.';

    if (error.status === 401) message = 'Invalid email or password.';
    else if (error.status === 403) message = 'Access denied. Admin privileges required.';
    else if (error.status === 429) message = serverMessage || 'Too many attempts. Try again later.';
    else if (serverMessage) message = serverMessage;

    return throwError(() => ({ message, originalError: error }));
  };
}
