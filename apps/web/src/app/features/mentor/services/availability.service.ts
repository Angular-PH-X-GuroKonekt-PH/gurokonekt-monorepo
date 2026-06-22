import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

import {
  DaysInWeek,
  TimeFrameInterface,
  UserAvailabilityInterface,
} from '@gurokonekt/models/interfaces/user/user.model';
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

interface AvailabilityResult {
  availabilities: UserAvailabilityInterface[];
  sessionDurationMinutes: number;
}

interface SaveAvailabilityPayload {
  availability: UserAvailabilityInterface[];
  sessionDurationMinutes: number;
}

interface AddAvailabilitySlotPayload {
  day: DaysInWeek;
  timeFrames: TimeFrameInterface[];
  sessionDurationMinutes?: number;
}

interface UpdateAvailabilitySlotPayload {
  day: DaysInWeek;
  timeFrameIndex: number;
  timeFrame: TimeFrameInterface;
}

interface DeleteAvailabilitySlotPayload {
  day: DaysInWeek;
  timeFrameIndex?: number;
}

interface SessionDurationData {
  sessionDurationMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);

  getAvailability(userId: string): Observable<AvailabilityResult> {
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

  updateAvailability(
    userId: string,
    payload: SaveAvailabilityPayload
  ): Observable<AvailabilityResult> {
    return this.http
      .put<ApiResponse<AvailabilityApiData>>(
        buildApiUrl(`/user/${userId}/availability`),
        payload
      )
      .pipe(
        map((response) =>
          validateApiResponse<AvailabilityApiData>(
            response,
            'Failed to update availability.'
          )
        ),
        map((data) => ({
          availabilities: data.availability ?? [],
          sessionDurationMinutes:
            data.sessionDurationMinutes ?? payload.sessionDurationMinutes,
        }))
      );
  }

  addAvailabilitySlot(
    userId: string,
    payload: AddAvailabilitySlotPayload
  ): Observable<AvailabilityResult> {
    return this.http
      .post<ApiResponse<AvailabilityApiData>>(
        buildApiUrl(`/user/${userId}/availability/slot`),
        payload
      )
      .pipe(
        map((response) =>
          validateApiResponse<AvailabilityApiData>(
            response,
            'Failed to add availability slot.'
          )
        ),
        map((data) => ({
          availabilities: data.availability ?? [],
          sessionDurationMinutes:
            data.sessionDurationMinutes ?? payload.sessionDurationMinutes ?? 60,
        }))
      );
  }

  deleteAvailabilitySlot(
    userId: string,
    payload: DeleteAvailabilitySlotPayload
  ): Observable<AvailabilityResult> {
    return this.http
      .request<ApiResponse<AvailabilityApiData>>(
        'delete',
        buildApiUrl(`/user/${userId}/availability/slot`),
        { body: payload }
      )
      .pipe(
        map((response) =>
          validateApiResponse<AvailabilityApiData>(
            response,
            'Failed to delete availability slot.'
          )
        ),
        map((data) => ({
          availabilities: data.availability ?? [],
          sessionDurationMinutes: data.sessionDurationMinutes ?? 60,
        }))
      );
  }

  updateAvailabilitySlot(
    userId: string,
    payload: UpdateAvailabilitySlotPayload
  ): Observable<AvailabilityResult> {
    return this.http
      .patch<ApiResponse<AvailabilityApiData>>(
        buildApiUrl(`/user/${userId}/availability/slot`),
        payload
      )
      .pipe(
        map((response) =>
          validateApiResponse<AvailabilityApiData>(
            response,
            'Failed to update availability slot.'
          )
        ),
        map((data) => ({
          availabilities: data.availability ?? [],
          sessionDurationMinutes: data.sessionDurationMinutes ?? 60,
        }))
      );
  }

  setSessionDuration(
    userId: string,
    sessionDurationMinutes: number
  ): Observable<SessionDurationData> {
    return this.http
      .patch<ApiResponse<SessionDurationData>>(
        buildApiUrl(`/user/${userId}/availability/duration`),
        { sessionDurationMinutes }
      )
      .pipe(
        map((response) =>
          validateApiResponse<SessionDurationData>(
            response,
            'Failed to update session duration.'
          )
        )
      );
  }
}
