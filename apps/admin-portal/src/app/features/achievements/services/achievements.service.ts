import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminAchievementInterface,
  AdminAchievementSubmissionInterface,
  AchievementAwardType,
  AchievementCriterion,
  MentorAchievementStatus,
} from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export interface AchievementPayload {
  name: string;
  description: string;
  icon: string;
  color: string;
  awardType: AchievementAwardType;
  requirements?: string | null;
  requiresProof?: boolean;
  autoApprove?: boolean;
  criteria?: AchievementCriterion[];
  validityMonths?: number | null;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AchievementsAdminService {
  private readonly http = inject(HttpClient);
  private readonly endpoints = API_CONFIG.endpoints.admin;

  list(): Observable<ApiResponse<AdminAchievementInterface[]>> {
    return this.http.get<ApiResponse<AdminAchievementInterface[]>>(buildApiUrl(this.endpoints.achievements));
  }

  create(payload: AchievementPayload): Observable<ApiResponse<AdminAchievementInterface & { awarded: number }>> {
    return this.http.post<ApiResponse<AdminAchievementInterface & { awarded: number }>>(
      buildApiUrl(this.endpoints.achievements),
      payload,
    );
  }

  /** `awardType` can't change after creation, so it is never sent here. */
  update(
    id: string,
    payload: Partial<Omit<AchievementPayload, 'awardType'>>,
  ): Observable<ApiResponse<AdminAchievementInterface & { awarded: number }>> {
    return this.http.patch<ApiResponse<AdminAchievementInterface & { awarded: number }>>(
      buildApiUrl(this.endpoints.achievementById(id)),
      payload,
    );
  }

  remove(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(buildApiUrl(this.endpoints.achievementById(id)));
  }

  evaluate(id: string): Observable<ApiResponse<{ awarded: number }>> {
    return this.http.post<ApiResponse<{ awarded: number }>>(buildApiUrl(this.endpoints.achievementEvaluate(id)), {});
  }

  submissions(status?: MentorAchievementStatus): Observable<ApiResponse<AdminAchievementSubmissionInterface[]>> {
    const params: Record<string, string> = status ? { status } : {};
    return this.http.get<ApiResponse<AdminAchievementSubmissionInterface[]>>(
      buildApiUrl(this.endpoints.achievementSubmissions),
      { params },
    );
  }

  proofUrl(submissionId: string): Observable<ApiResponse<{ url: string; expiresInSeconds: number }>> {
    return this.http.get<ApiResponse<{ url: string; expiresInSeconds: number }>>(
      buildApiUrl(this.endpoints.achievementSubmissionProof(submissionId)),
    );
  }

  approve(submissionId: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(buildApiUrl(this.endpoints.achievementSubmissionAction(submissionId, 'approve')), {});
  }

  reject(submissionId: string, reason: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(buildApiUrl(this.endpoints.achievementSubmissionAction(submissionId, 'reject')), {
      reason,
    });
  }

  revoke(submissionId: string, reason: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(buildApiUrl(this.endpoints.achievementSubmissionAction(submissionId, 'revoke')), {
      reason,
    });
  }
}
