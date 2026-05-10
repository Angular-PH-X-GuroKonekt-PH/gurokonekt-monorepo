import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable} from 'rxjs';

import { ApiResponse } from '../interfaces/api-response.interface';
import {
  BookingStatus,
  BookingCardInterface,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import {
  handleApiErrorWithFallback,
  validateApiResponse,
} from '../helpers/api-response.helper';
import { buildApiUrl } from '../utils/api.util';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
 
  getBookingsByUserId(userId: string): Observable<BookingCardInterface[]> {
    return this.http
      .get<ApiResponse<BookingCardInterface[]>>(
        buildApiUrl(`/booking/user/${userId}`)
      )
      .pipe(
        map((response) =>
          validateApiResponse<BookingCardInterface[]>(
            response,
            'Failed to fetch bookings.'
          )
        ),
        map((bookings) =>
          bookings.filter(
            (booking) =>
              booking.status !== BookingStatus.DELETED && !booking.isDeleted
          )
        ),
        map((bookings) =>
          bookings.map((booking) => ({
            ...booking,
            sessionDateTime: new Date(booking.sessionDateTime),
            createdAt: new Date(booking.createdAt),
            updatedAt: new Date(booking.updatedAt),
          }))
        ),
        catchError(handleApiErrorWithFallback([], 'Failed to fetch bookings'))
      );
  }

  getBookingsByStatuses(userId: string, statuses: BookingStatus[]): Observable<BookingCardInterface[]> {
    return this.getBookingsByUserId(userId).pipe(
      map((booking) =>
        booking.filter((booking) => statuses.includes(booking.status))
      )
    );
  } 



















}
