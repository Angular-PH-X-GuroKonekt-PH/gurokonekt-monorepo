import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs';
import { MentorSearchFilter, MentorSearchRequest, MentorSearchResultInterface } from '@gurokonekt/models/interfaces/search/search.model';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';
import { buildApiUrl } from '../../../shared/utils/api.util';

@Injectable({ providedIn: 'root' })
export class MentorSearchService {
  private readonly http = inject(HttpClient);

  searchMentors(filters: MentorSearchFilter): Observable<MentorSearchResultInterface> {
    const params = this.buildQueryParams(filters);
    return this.http
      .get<ApiResponse<MentorSearchResultInterface>>(buildApiUrl('/search'), { params })
      .pipe(
        map((response) => response.data ?? this.buildEmptySearchResult(filters)),
        catchError(this.handleError),
      );
  }

  getSkillOptions(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(buildApiUrl('/search/meta/skills'))
      .pipe(map((response) => response.data ?? []), catchError(this.handleError));
  }

  getExpertiseOptions(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(buildApiUrl('/search/meta/expertise'))
      .pipe(map((response) => response.data ?? []), catchError(this.handleError));
  }


  private buildQueryParams(filters: MentorSearchFilter): HttpParams {
    const dto: MentorSearchRequest = {
      page: filters.page,
      limit: filters.limit,
      ...(filters.name?.trim() ? { name: filters.name.trim() } : {}),
      ...(filters.skills.length ? { skills: filters.skills.join(',') } : {}),
      ...(filters.expertise.length ? { expertise: filters.expertise.join(',') } : {}),
      ...(filters.availabilityDay != null ? { availabilityDay: filters.availabilityDay } : {}),
      ...(filters.language != null ? { language: filters.language } : {}),
      ...(filters.minSessionRate != null ? { minSessionRate: filters.minSessionRate } : {}),
      ...(filters.maxSessionRate != null ? { maxSessionRate: filters.maxSessionRate } : {}),
      ...(filters.minYearsExperience != null ? { minYearsExperience: filters.minYearsExperience } : {}),
      ...(filters.maxYearsExperience != null ? { maxYearsExperience: filters.maxYearsExperience } : {}),
      // ...(filters.minRating != null ? { minRating: filters.minRating } : {}), // PENDING BACKEND
    };

    return Object.entries(dto).reduce((params, [key, value]) => {
      return value == null ? params : params.set(key, String(value));
    }, new HttpParams());
  }

  private buildEmptySearchResult(filters: MentorSearchFilter): MentorSearchResultInterface {
    return {
      total: 0,
      page: filters.page,
      limit: filters.limit,
      results: [],
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message ?? 'An unexpected error occurred. Please try again.';
    return throwError(() => new Error(message));
  }
}
