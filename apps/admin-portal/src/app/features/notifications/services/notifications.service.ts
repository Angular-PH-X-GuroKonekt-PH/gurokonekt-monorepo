import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);

  broadcast(payload: BroadcastPayload): Observable<ApiResponse<BroadcastResult>> {
    return this.http.post<ApiResponse<BroadcastResult>>(
      buildApiUrl(API_CONFIG.endpoints.admin.broadcastAnnouncement),
      payload
    );
  }
}
