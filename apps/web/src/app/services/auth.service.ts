import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegisterMenteeRequest, RegisterMentorRequest, AuthResponse } from '@gurokonekt/models';

import { API_CONFIG } from '../config/api.config';
import { buildApiUrl } from '../helpers/api.helper';
import { HttpErrorHelper } from '../helpers/http-error.helper';

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