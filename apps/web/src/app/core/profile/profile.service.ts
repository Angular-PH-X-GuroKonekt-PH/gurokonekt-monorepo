import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import type {
  UpdateMenteeProfileInterface,
  UpdateMentorProfileInterface,
} from '@gurokonekt/models/interfaces/user/user.model';

import { getErrorMessage } from '../../shared/utils/http-error.util';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { buildApiUrl } from '../../shared/utils/api.util';
import { API_CONFIG } from '../config/api.config';
import type {
  DeactivationFeedbackRequest,
  ActivateAccountResponse,
  InitiateDeactivationRequest,
  VerifyDeactivationTokenResponse,
} from '../../shared/interfaces/account-deactivation.interface';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private static readonly SUCCESS_STATUS_CODE = 200;

  /**
   * Update mentee profile with optional avatar upload
   */
  updateMenteeProfile(
    userId: string,
    data: Partial<UpdateMenteeProfileInterface>,
    avatarFile?: File
  ): Observable<ApiResponse> {
    const formData = this.buildMenteeProfileFormData(userId, data, avatarFile);
    
    return this.http.patch<ApiResponse>(
      buildApiUrl(`/user/${userId}/profile`),
      formData
    ).pipe(
      mergeMap((response) => this.validateApiResponse(response, 'Failed to update profile')),
      catchError(this.handleError)
    );
  }

  /**
   * Update mentor profile with optional avatar upload
   */
  updateMentorProfile(
    userId: string,
    data: Partial<UpdateMentorProfileInterface>,
    avatarFile?: File
  ): Observable<ApiResponse> {
    const formData = this.buildMentorProfileFormData(userId, data, avatarFile);

    return this.http.patch<ApiResponse>(
      buildApiUrl(`/user/${userId}/profile`),
      formData
    ).pipe(
      mergeMap((response) => this.validateApiResponse(response, 'Failed to update mentor profile')),
      catchError(this.handleError)
    );
  }

  /**
   * Get user profile by ID
   */
  getUserProfile(userId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      buildApiUrl(`/user/${userId}/profile`)
    ).pipe(
      mergeMap((response) => this.validateApiResponse(response, 'Failed to get profile')),
      catchError(this.handleError)
    );
  }

  /**
   * Get mentee profile (convenience method)
   */
  getMenteeProfile(userId: string): Observable<ApiResponse> {
    return this.getUserProfile(userId);
  }

  initiateAccountDeactivation(
    userId: string,
    request: InitiateDeactivationRequest,
  ): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(
        buildApiUrl(API_CONFIG.endpoints.user.initiateDeactivation(userId)),
        request,
      )
      .pipe(
        mergeMap((response) =>
          this.validateApiResponse(response, 'Failed to initiate account deactivation'),
        ),
        catchError(this.handleError),
      );
  }

  verifyDeactivationToken(
    token: string,
  ): Observable<ApiResponse<VerifyDeactivationTokenResponse>> {
    return this.http
      .post<ApiResponse<VerifyDeactivationTokenResponse>>(
        buildApiUrl(API_CONFIG.endpoints.user.verifyDeactivation),
        { token },
      )
      .pipe(
        mergeMap((response) =>
          this.validateApiResponse(response, 'Unable to verify the deactivation link'),
        ),
        catchError(this.handleError),
      );
  }

  submitDeactivationFeedback(
    userId: string,
    request: DeactivationFeedbackRequest,
  ): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(
        buildApiUrl(API_CONFIG.endpoints.user.submitDeactivationFeedback(userId)),
        request,
      )
      .pipe(
        mergeMap((response) =>
          this.validateApiResponse(response, 'Failed to deactivate account'),
        ),
        catchError(this.handleError),
      );
  }

  activateAccount(
    userId: string,
    reason: string,
  ): Observable<ApiResponse<ActivateAccountResponse>> {
    return this.http
      .patch<ApiResponse<ActivateAccountResponse>>(
        buildApiUrl(API_CONFIG.endpoints.user.activateAccount(userId)),
        { reason },
      )
      .pipe(
        mergeMap((response) =>
          this.validateApiResponse(response, 'Failed to process account activation'),
        ),
        catchError(this.handleError),
      );
  }

  private buildMenteeProfileFormData(
    userId: string,
    data: Partial<UpdateMenteeProfileInterface>,
    avatarFile?: File
  ): FormData {
    const formData = new FormData();

    this.appendFieldIfPresent(formData, 'bio', data.bio);
    this.appendFieldIfPresent(formData, 'phoneNumber', data.phoneNumber);
    this.appendFieldIfPresent(formData, 'country', data.country);
    this.appendFieldIfPresent(formData, 'language', data.language);
    this.appendFieldIfPresent(formData, 'timezone', data.timezone);
    this.appendArrayField(formData, 'learningGoals', data.learningGoals);
    this.appendArrayField(formData, 'areasOfInterest', data.areasOfInterest);
    this.appendArrayField(formData, 'preferredSessionType', data.preferredSessionType);

    formData.append('updatedById', userId);

    if (avatarFile) {
      formData.append('avatar', avatarFile, avatarFile.name);
    }

    return formData;
  }

  private buildMentorProfileFormData(
    userId: string,
    data: Partial<UpdateMentorProfileInterface>,
    avatarFile?: File
  ): FormData {
    const formData = new FormData();

    this.appendFieldIfPresent(formData, 'bio', data.bio);
    this.appendFieldIfPresent(formData, 'phoneNumber', data.phoneNumber);
    this.appendFieldIfPresent(formData, 'country', data.country);
    this.appendFieldIfPresent(formData, 'language', data.language);
    this.appendFieldIfPresent(formData, 'timezone', data.timezone);
    this.appendFieldIfPresent(formData, 'yearsOfExperience', data.yearsOfExperience?.toString());
    this.appendArrayField(formData, 'areasOfExpertise', data.areasOfExpertise);
    this.appendArrayField(formData, 'skills', data.skills);

    if (data.linkedInUrl !== undefined) {
      formData.append('linkedInUrl', data.linkedInUrl ?? '');
    }

    if (data.availability) {
      formData.append('availability', JSON.stringify(data.availability));
    }

    formData.append('updatedById', userId);

    if (avatarFile) {
      formData.append('avatar', avatarFile, avatarFile.name);
    }

    return formData;
  }

  private appendFieldIfPresent(formData: FormData, key: string, value?: string): void {
    if (value) {
      formData.append(key, value);
    }
  }

  private appendArrayField(formData: FormData, key: string, values?: string[]): void {
    if (!values || values.length === 0) {
      return;
    }

    values.forEach((value) => {
      formData.append(`${key}[]`, value);
    });
  }

  private validateApiResponse<T>(
    response: ApiResponse<T>,
    fallbackMessage: string,
  ): Observable<ApiResponse<T>> {
    if (response.statusCode && response.statusCode !== ProfileService.SUCCESS_STATUS_CODE) {
      return throwError(() => ({
        message: response.message || fallbackMessage,
        statusCode: response.statusCode,
      }));
    }

    return of(response);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse | { message?: string; statusCode?: number }): Observable<never> {
    if (!(error instanceof HttpErrorResponse)) {
      return throwError(() => ({
        message: error.message || 'An unexpected error occurred',
        statusCode: error.statusCode || 500,
      }));
    }

    const errorMessage = getErrorMessage(error);
    const statusCode = error.status || 500;
    
    return throwError(() => ({
      message: errorMessage,
      statusCode: statusCode,
      originalError: error instanceof HttpErrorResponse ? error : undefined,
    }));
  }
}
