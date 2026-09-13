import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MentorDashboardInterface } from '@gurokonekt/models';
import { catchError, map, Observable } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import {
  handleApiError,
  validateApiResponse,
} from '../../../shared/helpers/api-response.helper';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';
import { buildApiUrl } from '../../../shared/utils/api.util';

@Injectable({ providedIn: 'root' })
export class MentorDashboardService {
  private readonly http = inject(HttpClient);

  getDashboard(userId: string): Observable<MentorDashboardInterface> {
    return this.http
      .get<
        ApiResponse<MentorDashboardInterface>
      >(buildApiUrl(API_CONFIG.endpoints.user.dashboard(userId)))
      .pipe(
        map((response) =>
          validateApiResponse(
            response,
            'Failed to fetch mentor dashboard data.',
          ),
        ),
        catchError(handleApiError),
      );
  }
}
