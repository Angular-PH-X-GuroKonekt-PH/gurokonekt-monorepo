import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export interface AdminAccount {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface AdminRolesData {
  total: number;
  admins: AdminAccount[];
}

export interface NotificationRecipient {
  id: string;
  email: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminRolesService {
  private readonly http = inject(HttpClient);

  getAdmins(): Observable<ApiResponse<AdminRolesData>> {
    return this.http.get<ApiResponse<AdminRolesData>>(
      buildApiUrl(API_CONFIG.endpoints.admin.roles)
    );
  }

  getNotificationRecipients(): Observable<ApiResponse<NotificationRecipient[]>> {
    return this.http.get<ApiResponse<NotificationRecipient[]>>(
      buildApiUrl(API_CONFIG.endpoints.admin.notificationRecipients)
    );
  }

  addNotificationRecipient(email: string): Observable<ApiResponse<NotificationRecipient>> {
    return this.http.post<ApiResponse<NotificationRecipient>>(
      buildApiUrl(API_CONFIG.endpoints.admin.notificationRecipients),
      { email }
    );
  }

  removeNotificationRecipient(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      buildApiUrl(API_CONFIG.endpoints.admin.notificationRecipientById(id))
    );
  }
}
