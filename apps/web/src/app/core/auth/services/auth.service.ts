import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthResponse } from '@gurokonekt/models/interfaces/auth/auth-response.interface';
import { RegisterMenteeRequest } from '@gurokonekt/models/interfaces/auth/register-mentee-request.interface';
import { RegisterMentorRequest } from '@gurokonekt/models/interfaces/auth/register-mentor-request.interface';
import { AuthUser } from '@gurokonekt/models/interfaces/auth/auth-user.interface';
import { getAuthErrorMessage, logError } from '../../../shared/utils/http-error.util';
import type {
  LoginApiResponse,
  RefreshTokenApiResponse,
  SessionApiResponse,
} from '../../../shared/interfaces/auth-api.interface';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';
import type { GoogleRegistrationRequiredInterface } from '@gurokonekt/models/interfaces/auth/signin.model';
import type { GoogleRegistrationContext } from '../models/registration.state.model';

export type GoogleSignInResult =
  | { kind: 'signed-in'; auth: AuthResponse }
  | { kind: 'registration-required'; context: GoogleRegistrationContext };

/** Mentee registration fields minus email and password, which Google covers. */
export interface RegisterMenteeWithGoogleRequest {
  registrationToken: string;
  refreshToken?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  phoneNumber: string;
  country: string;
  timezone: string;
  language: string;
}

export interface RegisterMentorWithGoogleRequest extends RegisterMenteeWithGoogleRequest {
  yearsOfExperience: number;
  linkedInUrl?: string;
  areasOfExpertise: string[];
  files: File[];
}

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
      map((response) => this.toAuthResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Continue with a Google ID token from the Google Sign-In button. An
   * existing account is signed in (same payload as password login); a new
   * Google account comes back as `registration-required` with the tokens and
   * profile prefill needed to finish registering.
   *
   * Errors keep the server's message: the API already words each case for the
   * user (pending mentor, admin...), and the generic auth mapping would turn
   * every 401 into "Invalid email or password".
   */
  loginWithGoogle(payload: { idToken: string; nonce?: string }): Observable<GoogleSignInResult> {
    return this.http.post<LoginApiResponse | ApiResponse<GoogleRegistrationRequiredInterface>>(
      buildApiUrl(API_CONFIG.endpoints.auth.googleLogin),
      payload
    ).pipe(
      map((response): GoogleSignInResult => {
        const data = response.data as Partial<GoogleRegistrationRequiredInterface> | undefined;
        if (data?.registrationRequired && data.registration && data.prefill) {
          return {
            kind: 'registration-required',
            context: { ...data.registration, prefill: data.prefill },
          };
        }
        return { kind: 'signed-in', auth: this.toAuthResponse(response as LoginApiResponse) };
      }),
      catchError(this.handleGoogleError('Google Sign-In Error', 'Google sign-in failed. Please try again.'))
    );
  }

  /**
   * Finish a mentee registration started with Google. The API signs the new
   * mentee in, so the result has the same shape as a login.
   */
  registerMenteeWithGoogle(payload: RegisterMenteeWithGoogleRequest): Observable<AuthResponse> {
    return this.http.post<LoginApiResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.googleRegisterMentee),
      payload
    ).pipe(
      map((response) => this.toAuthResponse(response)),
      catchError(this.handleGoogleError('Google Registration Error', 'Registration failed. Please try again.'))
    );
  }

  /** Finish a mentor application started with Google. It then awaits admin approval. */
  registerMentorWithGoogle(payload: RegisterMentorWithGoogleRequest): Observable<ApiResponse<unknown>> {
    const formData = new FormData();
    formData.append('registrationToken', payload.registrationToken);
    if (payload.refreshToken) formData.append('refreshToken', payload.refreshToken);
    formData.append('firstName', payload.firstName);
    formData.append('lastName', payload.lastName);
    if (payload.middleName) formData.append('middleName', payload.middleName);
    if (payload.suffix) formData.append('suffix', payload.suffix);
    formData.append('country', payload.country);
    formData.append('timezone', payload.timezone);
    formData.append('language', payload.language);
    formData.append('phoneNumber', payload.phoneNumber);
    formData.append('yearsOfExperience', payload.yearsOfExperience.toString());
    if (payload.linkedInUrl) formData.append('linkedInUrl', payload.linkedInUrl);
    // Same encoding as registerMentor: the API parses the JSON string.
    formData.append('areasOfExpertise', JSON.stringify(payload.areasOfExpertise));
    payload.files.forEach((file) => formData.append('files', file));

    return this.http.post<ApiResponse<unknown>>(
      buildApiUrl(API_CONFIG.endpoints.auth.googleRegisterMentor),
      formData
    ).pipe(
      catchError(this.handleGoogleError('Google Registration Error', 'Registration failed. Please try again.'))
    );
  }

  /**
   * Error handler for the Google endpoints. Logs only the status and server
   * message, never the request body, so Google and registration tokens stay out
   * of the console.
   */
  private handleGoogleError(context: string, fallbackMessage: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      logError(context, { status: error.status, message: error.error?.message });
      let message: string;
      if (error.status === 0) {
        message = 'Unable to reach the server. Please check your connection and try again.';
      } else if (error.status === 409 && error.error?.message === 'User already exists') {
        message = 'You already have a GuroKonekt account. Please log in with Google instead.';
      } else {
        message = error.error?.message || fallbackMessage;
      }
      return throwError(() => ({ message, statusCode: error.status, originalError: error }));
    };
  }

  private toAuthResponse(response: LoginApiResponse): AuthResponse {
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
        status: user.status as AuthResponse['user']['status'],
        isProfileComplete: user.isProfileComplete,
        isMentorProfileComplete: user.isMentorProfileComplete,
      },
      accessToken,
      refreshToken,
      token: accessToken,
      message: response.message
    } as AuthResponse;
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
   * Ask the API who the bearer token belongs to. The interceptor refreshes an
   * expired token before this leaves, so a failure here means the session is
   * genuinely over.
   */
  getSession(): Observable<AuthUser> {
    return this.http.get<SessionApiResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.session)
    ).pipe(
      map((response) => {
        const data = response.data;
        if (!data?.id || !data.email || !data.role) {
          throw { message: response.message || 'Session lookup failed', statusCode: 401 };
        }

        return {
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          isProfileComplete: data.isProfileComplete,
          isMentorProfileComplete: data.isMentorProfileComplete,
        } as AuthUser;
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
