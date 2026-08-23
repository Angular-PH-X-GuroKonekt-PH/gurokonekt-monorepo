import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export type AnnouncementTargetRole = 'mentor' | 'mentee' | 'all';

export interface BroadcastPayload {
  title: string;
  message: string;
  targetRole: AnnouncementTargetRole;
}

export interface BroadcastResult {
  sent: number;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  message: string;
  recipientCount: number;
  createdAt: string;
}

export interface AnnouncementListQueryParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'title' | 'recipientCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AnnouncementListResult {
  data: AnnouncementSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);

  broadcast(
    payload: BroadcastPayload,
  ): Observable<ApiResponse<BroadcastResult>> {
    return this.http.post<ApiResponse<BroadcastResult>>(
      buildApiUrl(API_CONFIG.endpoints.admin.broadcastAnnouncement),
      payload,
    );
  }

  listAnnouncements(
    query: AnnouncementListQueryParams = {},
  ): Observable<ApiResponse<AnnouncementListResult>> {
    const params = Object.entries(query).reduce(
      (httpParams, [key, value]) =>
        value === undefined ? httpParams : httpParams.set(key, String(value)),
      new HttpParams(),
    );

    return this.http.get<ApiResponse<AnnouncementListResult>>(
      buildApiUrl(API_CONFIG.endpoints.admin.announcements),
      { params },
    );
  }
}
