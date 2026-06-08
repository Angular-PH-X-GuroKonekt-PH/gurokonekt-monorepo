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

@Injectable({ providedIn: 'root' })
export class AdminRolesService {
  private readonly http = inject(HttpClient);

  getAdmins(): Observable<ApiResponse<AdminRolesData>> {
    return this.http.get<ApiResponse<AdminRolesData>>(
      buildApiUrl(API_CONFIG.endpoints.admin.roles)
    );
  }
}
