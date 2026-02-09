import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegisterMenteeRequest, RegisterMentorRequest, ApiResponse } from '@gurokonekt/models';

import { API_CONFIG } from '../config/api.config';
import { buildApiUrl } from '../helpers/api.helper';
import { HttpErrorHelper } from '../helpers/http-error.helper';
import { AuthResponse } from '../types/auth-api-response.types';

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
    return this.http.post<AuthResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.registerMentor),
      data
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Login with email and password
   */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      buildApiUrl(API_CONFIG.endpoints.auth.login),
      credentials
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors with user-friendly messages
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    const errorMessage = HttpErrorHelper.getAuthErrorMessage(error);
    
    HttpErrorHelper.logError('Auth API Error', error);

    return throwError(() => ({ message: errorMessage, originalError: error }));
  };
}