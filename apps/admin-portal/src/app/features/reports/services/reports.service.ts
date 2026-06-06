import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export interface OverviewReport {
  users: {
    totalMentors: number;
    totalMentees: number;
    total: number;
    mentors: { approved: number; pending: number; rejected: number; inactive: number };
  };
  sessions: {
    total: number;
    byStatus: Record<string, number>;
    completionRate: number;
    cancellationRate: number;
  };
  averageSessionRate: number;
}

export interface SessionsReport {
  total: number;
  byStatus: Record<string, number>;
  completionRate: number;
  cancellationRate: number;
  upcomingThisWeek: number;
}

export interface TopMentor {
  id: string;
  name: string;
  completedSessions: number;
  sessionRate: number | null;
}

export interface MentorsReport {
  total: number;
  byStatus: Record<string, number>;
  topByCompletedSessions: TopMentor[];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);

  getOverview(): Observable<ApiResponse<OverviewReport>> {
    return this.http.get<ApiResponse<OverviewReport>>(
      buildApiUrl(API_CONFIG.endpoints.admin.reportsOverview)
    );
  }

  getSessions(): Observable<ApiResponse<SessionsReport>> {
    return this.http.get<ApiResponse<SessionsReport>>(
      buildApiUrl(API_CONFIG.endpoints.admin.reportsSessions)
    );
  }

  getMentors(): Observable<ApiResponse<MentorsReport>> {
    return this.http.get<ApiResponse<MentorsReport>>(
      buildApiUrl(API_CONFIG.endpoints.admin.reportsMentors)
    );
  }
}
