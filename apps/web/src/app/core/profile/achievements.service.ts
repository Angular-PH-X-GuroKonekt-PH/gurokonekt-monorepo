import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  MentorAchievementCatalogItem,
  MentorAchievementInterface,
} from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { buildApiUrl } from '../../shared/utils/api.util';
import { getErrorMessage } from '../../shared/utils/http-error.util';
import { API_CONFIG } from '../config/api.config';

export interface AchievementApplication {
  details?: string;
  earnedAt?: string;
  expiresAt?: string;
  proof?: File | null;
  /** Keep the file already on record when no new one is chosen. */
  keepProof?: boolean;
}

/** The signed-in mentor's achievements (issue #419). */
@Injectable({ providedIn: 'root' })
export class AchievementsService {
  private readonly http = inject(HttpClient);
  private readonly endpoints = API_CONFIG.endpoints.achievements;

  getCatalog(): Observable<ApiResponse<MentorAchievementCatalogItem[]>> {
    return this.http
      .get<ApiResponse<MentorAchievementCatalogItem[]>>(buildApiUrl(this.endpoints.catalog))
      .pipe(catchError(this.toMessage));
  }

  submit(achievementId: string, application: AchievementApplication): Observable<ApiResponse<MentorAchievementInterface>> {
    const form = new FormData();
    if (application.details) form.append('details', application.details);
    if (application.earnedAt) form.append('earnedAt', application.earnedAt);
    if (application.expiresAt) form.append('expiresAt', application.expiresAt);
    if (application.proof) form.append('proof', application.proof);
    if (application.keepProof) form.append('keepProof', 'true');

    return this.http
      .put<ApiResponse<MentorAchievementInterface>>(buildApiUrl(this.endpoints.application(achievementId)), form)
      .pipe(catchError(this.toMessage));
  }

  withdraw(achievementId: string): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(buildApiUrl(this.endpoints.application(achievementId)))
      .pipe(catchError(this.toMessage));
  }

  private toMessage(error: HttpErrorResponse): Observable<never> {
    return throwError(() => ({ message: getErrorMessage(error), statusCode: error.status }));
  }
}
