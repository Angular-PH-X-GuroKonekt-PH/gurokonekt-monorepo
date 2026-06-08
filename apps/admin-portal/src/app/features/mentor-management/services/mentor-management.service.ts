import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse, PaginatedResponse } from '../../../shared/interfaces/api-response.interface';

export interface MentorListItem {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  status: string;
  isMentorApproved: boolean;
  isMentorProfileComplete: boolean;
  isProfileComplete: boolean;
  createdAt: string;
  avatarUrl: string | null;
}

export interface MentorProfile {
  id: string;
  title: string | null;
  areasOfExpertise: string[];
  yearsOfExperience: number | null;
  linkedInUrl: string | null;
  bio: string | null;
  skills: string[];
  sessionRate: number | null;
  sessionDurationMinutes: number;
  availability: unknown;
}

export interface DocumentAttachment {
  id: string;
  userId: string;
  bucketName: string;
  storagePath: string;
  publicUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface MentorDetail extends MentorListItem {
  phoneNumber: string | null;
  country: string | null;
  language: string | null;
  timezone: string | null;
  mentorProfile: MentorProfile | null;
  documentAttachments: DocumentAttachment[];
}

export interface MentorRejectionLog {
  id: string;
  mentorId: string | null;
  adminId: string;
  reason: string;
  createdAt: string;
}

export interface MentorDeactivationFeedback {
  id: string;
  userId: string;
  reason: string;
  createdAt: string;
}

export interface MentorsQueryParams {
  status?: 'all' | 'pending' | 'approved' | 'rejected' | 'inactive';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MentorManagementService {
  private readonly http = inject(HttpClient);

  getMentors(params: MentorsQueryParams = {}): Observable<ApiResponse<PaginatedResponse<MentorListItem>>> {
    return this.http.get<ApiResponse<PaginatedResponse<MentorListItem>>>(
      buildApiUrl(API_CONFIG.endpoints.admin.mentors),
      { params: { ...params } as Record<string, string | number> }
    );
  }

  getMentor(id: string): Observable<ApiResponse<MentorDetail>> {
    return this.http.get<ApiResponse<MentorDetail>>(
      buildApiUrl(API_CONFIG.endpoints.admin.mentorById(id))
    );
  }

  getRejectionLog(id: string): Observable<ApiResponse<MentorRejectionLog>> {
    return this.http.get<ApiResponse<MentorRejectionLog>>(
      buildApiUrl(API_CONFIG.endpoints.admin.mentorRejectionLog(id))
    );
  }

  getDeactivationFeedback(id: string): Observable<ApiResponse<MentorDeactivationFeedback | null>> {
    return this.http.get<ApiResponse<MentorDeactivationFeedback | null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.mentorDeactivationFeedback(id))
    );
  }

  approveMentor(id: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.approveMentor(id)),
      {}
    );
  }

  rejectMentor(id: string, reason: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.rejectMentor(id)),
      { reason }
    );
  }

  deactivateMentor(id: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.deactivateMentor(id)),
      {}
    );
  }
}
