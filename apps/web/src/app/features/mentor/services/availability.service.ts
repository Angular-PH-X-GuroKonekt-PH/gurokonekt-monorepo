import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';
import { buildApiUrl } from '../../../shared/utils/api.util';
import {
  validateApiResponse,
  handleApiErrorWithFallback,
} from '../../../shared/helpers/api-response.helper';

interface AvailabilityApiData {
  availability: UserAvailabilityInterface[];
  sessionDurationMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);

  getAvailability(
    userId: string
  ): Observable<{
    availabilities: UserAvailabilityInterface[];
    sessionDurationMinutes: number;
  }> {
    return this.http
      .get<ApiResponse<AvailabilityApiData>>(
        buildApiUrl(`/user/${userId}/availability`)
      )
      .pipe(
        map((response) =>
          validateApiResponse<AvailabilityApiData>(
            response,
            'Failed to fetch availability.'
          )
        ),
        map((data) => ({
          availabilities: data.availability ?? [],
          sessionDurationMinutes: data.sessionDurationMinutes ?? 60,
        })),
        catchError(
          handleApiErrorWithFallback(
            { availabilities: [], sessionDurationMinutes: 60 },
            'Failed to fetch availability'
          )
        )
      );
  }
}
