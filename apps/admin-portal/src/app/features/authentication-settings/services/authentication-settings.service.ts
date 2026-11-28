import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type { AuthenticationSettingsInterface } from '@gurokonekt/models/interfaces/auth-requirements/auth-requirements.model';
import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../../core/config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export type AuthenticationSettings = AuthenticationSettingsInterface;

@Injectable({ providedIn: 'root' })
export class AuthenticationSettingsService {
  private readonly http = inject(HttpClient);
  private readonly url = buildApiUrl(API_CONFIG.endpoints.admin.authenticationSettings);

  get(): Observable<AuthenticationSettings> {
    return this.http.get<ApiResponse<AuthenticationSettings>>(this.url).pipe(map((r) => r.data as AuthenticationSettings));
  }

  save(settings: { passkeyRequired: boolean; googleIdpRequired: boolean }): Observable<ApiResponse<AuthenticationSettings>> {
    return this.http.put<ApiResponse<AuthenticationSettings>>(this.url, settings);
  }
}
