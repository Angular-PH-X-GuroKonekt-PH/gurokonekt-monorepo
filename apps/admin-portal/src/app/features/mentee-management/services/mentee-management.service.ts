import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse, PaginatedResponse } from '../../../shared/interfaces/api-response.interface';

export interface MenteeListItem {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  country: string | null;
  status: string;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

export interface MenteeDetail extends MenteeListItem {
  language: string | null;
  timezone: string | null;
  menteeProfile: {
    id: string;
    bio: string | null;
    learningGoals: string[];
    areasOfInterest: string[];
    preferredSessionType: string | null;
  } | null;
}

export interface MenteesQueryParams {
  status?: 'active' | 'inactive' | 'all';
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MenteeManagementService {
  private readonly http = inject(HttpClient);

  getMentees(params: MenteesQueryParams = {}): Observable<ApiResponse<PaginatedResponse<MenteeListItem>>> {
    return this.http.get<ApiResponse<PaginatedResponse<MenteeListItem>>>(
      buildApiUrl(API_CONFIG.endpoints.admin.mentees),
      { params: { ...params } as Record<string, string | number> }
    );
  }

  getMenteeById(id: string): Observable<ApiResponse<MenteeDetail>> {
    return this.http.get<ApiResponse<MenteeDetail>>(
      buildApiUrl(API_CONFIG.endpoints.admin.menteeById(id))
    );
  }

  activateMentee(id: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.menteeActivate(id)),
      {}
    );
  }

  deactivateMentee(id: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.menteeDeactivate(id)),
      {}
    );
  }

  rejectMentee(id: string, reason: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.menteeReject(id)),
      { reason }
    );
  }

  resendVerification(id: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.menteeResendVerification(id)),
      {}
    );
  }

  getRejectionLog(id: string): Observable<ApiResponse<{ reason: string; createdAt: string }>> {
    return this.http.get<ApiResponse<{ reason: string; createdAt: string }>>(
      buildApiUrl(API_CONFIG.endpoints.admin.menteeRejectionLog(id))
    );
  }
}
