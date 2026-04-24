import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import type {
  UpdateMenteeProfileInterface,
  UpdateMentorProfileInterface,
} from '@gurokonekt/models/interfaces/user/user.model';

import { buildApiUrl } from '../helpers/api.helper';
import { HttpErrorHelper } from '../helpers/http-error.helper';
import { ApiResponse } from '../interfaces/api-response.interface';

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
   * Update mentor profile with required avatar upload during setup
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
    this.appendFieldIfPresent(formData, 'preferredSessionType', data.preferredSessionType);

    if (data.availability) {
      formData.append('availability', JSON.stringify(data.availability));
    }

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
      formData.append(key, value);
    });
  }

  private validateApiResponse(response: ApiResponse, fallbackMessage: string): Observable<ApiResponse> {
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

    const errorMessage = HttpErrorHelper.getErrorMessage(error);
    const statusCode = error.status || 500;
    
    return throwError(() => ({
      message: errorMessage,
      statusCode: statusCode
    }));
  }
}
