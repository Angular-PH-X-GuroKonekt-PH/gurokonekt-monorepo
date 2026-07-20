import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthResponse } from '@gurokonekt/models/interfaces/auth/auth-response.interface';
import { RegisterMenteeRequest } from '@gurokonekt/models/interfaces/auth/register-mentee-request.interface';
import { RegisterMentorRequest } from '@gurokonekt/models/interfaces/auth/register-mentor-request.interface';
import { getAuthErrorMessage, logError } from '../../../shared/utils/http-error.util';
import type {
  LoginApiResponse,
  RefreshTokenApiResponse,
} from '../../../shared/interfaces/auth-api.interface';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  /**
   * Register a new mentee account
   */
  registerMentee(data: RegisterMenteeRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.registerMentee),
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Register a new mentor account
   */
  registerMentor(data: RegisterMentorRequest): Observable<AuthResponse> {
    // Create FormData to handle file uploads
    const formData = new FormData();
    
    // Append all text fields
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    if (data.middleName) formData.append('middleName', data.middleName);
    if (data.suffix) formData.append('suffix', data.suffix);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('confirmPassword', data.confirmPassword);
    formData.append('country', data.country);
    formData.append('timezone', data.timezone);
    formData.append('language', data.language);
    formData.append('phoneNumber', data.phoneNumber);
    formData.append('yearsOfExperience', data.yearsOfExperience.toString());
    if (data.linkedInUrl) formData.append('linkedInUrl', data.linkedInUrl);
    
    // Append areasOfExpertise as JSON string (backend will parse it)
    formData.append('areasOfExpertise', JSON.stringify(data.areasOfExpertise));

    if (data.emailRedirectTo) {
      formData.append('emailRedirectTo', data.emailRedirectTo);
    }
    
    // Append files
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }
    
    return this.http.post<AuthResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.registerMentor),
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Login with email and password
   */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<LoginApiResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.login),
      credentials
    ).pipe(
      map((response) => {
        if (response.statusCode >= 400) {
          throw {
            message: response.message || 'Login failed',
            statusCode: response.statusCode,
          };
        }

        const data = response.data;
        const user = data?.user ?? data?.auth?.user;
        const session = data?.session ?? data?.auth?.session;
        const accessToken = session?.access_token ?? data?.accessToken;
        const refreshToken = session?.refresh_token ?? data?.refreshToken;

        // Accept both the current session payload and older token-based payloads.
        if (!data || !user || !accessToken) {
          throw {
            message: response.message || 'Login failed',
            statusCode: response.statusCode || 500,
          };
        }

        return {
          user: {
            id: user.id,
            email: user.email,
            fullName: `${user.firstName} ${user.lastName}`,
            role: user.role,
            isProfileComplete: user.isProfileComplete,
            isMentorProfileComplete: user.isMentorProfileComplete,
          },
          accessToken,
          refreshToken,
          token: accessToken,
          message: response.message
        } as AuthResponse;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Refresh access token using a stored refresh token
   */
  refreshToken(refreshToken: string): Observable<{ accessToken: string; refreshToken: string }> {
    return this.http.post<RefreshTokenApiResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.refreshToken),
      { refreshToken }
    ).pipe(
      map((response) => {
        if (!response.data?.accessToken || !response.data?.refreshToken) {
          throw new Error(response.message || 'Token refresh failed');
        }

        return {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(email: string, emailRedirectTo?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.resendConfirmation),
      { type: 'signup', email, ...(emailRedirectTo ? { emailRedirectTo } : {}) }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors with user-friendly messages
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const errorMessage = getAuthErrorMessage(error);
    
    logError('Auth API Error', error);

    return throwError(() => ({ message: errorMessage, originalError: error }));
  };

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(
        buildApiUrl(API_CONFIG.endpoints.auth.forgotPassword),
        { email }
      )
      .pipe(catchError(this.handleError));
  }

  completePasswordReset(payload: {
    accessToken: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(
        buildApiUrl(API_CONFIG.endpoints.auth.completePasswordReset),
        payload
      )
      .pipe(catchError(this.handleError));
  }
}
