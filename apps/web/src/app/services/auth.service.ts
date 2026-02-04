import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { API_CONFIG, buildApiUrl } from '../config/api.config';
import { 
  RegisterMenteeRequest, 
  RegisterMentorRequest, 
  ApiResponse, 
  AuthResponse 
} from '../types/api.types';

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
   * Handle HTTP errors with user-friendly messages
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 409) {
      errorMessage = 'Email address is already registered. Please use a different email.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid registration data. Please check your inputs.';
    } else if (error.status === 422) {
      errorMessage = 'Validation failed. Please check your inputs and try again.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    console.error('Auth API Error:', {
      status: error.status,
      message: error.message,
      error: error.error
    });

    return throwError(() => ({ message: errorMessage, originalError: error }));
  };
}