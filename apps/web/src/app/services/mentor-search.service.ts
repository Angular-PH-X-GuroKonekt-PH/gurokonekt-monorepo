import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MentorSearchFilter, MentorSearchRequest, MentorSearchResultInterface } from '@gurokonekt/models/interfaces/search/search.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

@Injectable({ providedIn: 'root' })
export class MentorSearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/mentors`;

  searchMentors(filters: MentorSearchFilter): Observable<MentorSearchResultInterface> {
    const params = this.buildQueryParams(filters);
    return this.http
      .get<ApiResponse<MentorSearchResultInterface>>(`${this.baseUrl}/search`, { params })
      .pipe(
        map(res => res.result),
        catchError(this.handleError),
      );
  }

  getSkillOptions(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.baseUrl}/meta/skills`)
      .pipe(map(res => res.result), catchError(this.handleError));
  }

  getExpertiseOptions(): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.baseUrl}/meta/expertise`)
      .pipe(map(res => res.result), catchError(this.handleError));
  }

  private buildQueryParams(filters: MentorSearchFilter): HttpParams {
    const dto: MentorSearchRequest = {
      page: filters.page,
      limit: filters.limit,
    };

    if (filters.name?.trim()) dto.name = filters.name.trim();
    if (filters.skills.length) dto.skills = filters.skills.join(',');
    if (filters.expertise.length) dto.expertise = filters.expertise.join(',');
    if (filters.minSessionRate != null) dto.minSessionRate = filters.minSessionRate;
    if (filters.maxSessionRate != null) dto.maxSessionRate = filters.maxSessionRate;
    if (filters.minYearsExperience != null) dto.minYearsExperience = filters.minYearsExperience;
    if (filters.sortBy != null) dto.sortBy = filters.sortBy;
    if (filters.sortOrder != null) dto.sortOrder = filters.sortOrder;

    // TODO: uncomment once backend adds these to SearchMentorDto:
    // if (filters.minRating    != null) dto.minRating    = filters.minRating;
    // if (filters.availability != null) dto.availability = filters.availability;

    let params = new HttpParams();
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    }
    return params;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.message ?? 'An unexpected error occurred. Please try again.';
    return throwError(() => new Error(message));
  }
}