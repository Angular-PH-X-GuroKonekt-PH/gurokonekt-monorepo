import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

import { ApiResponse } from '../interfaces/api-response.interface';
import {
  BookingStatus,
  BookingCardInterface,
  CreateBookingRequestInterface,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import {
  handleApiError,
  handleApiErrorWithFallback,
  validateApiResponse,
} from '../helpers/api-response.helper';
import { buildApiUrl } from '../utils/api.util';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);

  createBooking(
    request: CreateBookingRequestInterface
  ): Observable<BookingCardInterface> {
    return this.http
      .post<ApiResponse<BookingCardInterface>>(buildApiUrl('/booking'), request)
      .pipe(
        map((response) => {
          if (response.status !== 'success' || !response.data) {
            throw {
              message: response.message || 'Failed to create booking.',
              statusCode: response.statusCode || 500,
            };
          }

          return response.data;
        }),
        map((booking) => ({
          ...booking,
          sessionDateTime: new Date(booking.sessionDateTime),
          createdAt: new Date(booking.createdAt),
          updatedAt: new Date(booking.updatedAt),
        })),
        catchError(handleApiError)
      );
  }

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

  getBookingsByStatuses(
    userId: string,
    statuses: BookingStatus[]
  ): Observable<BookingCardInterface[]> {
    return this.getBookingsByUserId(userId).pipe(
      map((booking) =>
        booking.filter((booking) => statuses.includes(booking.status))
      )
    );
  }

  getMentorBookings(status?: BookingStatus): Observable<BookingCardInterface[]> {
    const query = status ? `?status=${status}` : '';

    return this.http
      .get<ApiResponse<BookingCardInterface[]>>(
        buildApiUrl(`/booking/mentor${query}`)
      )
      .pipe(
        map((response) =>
          validateApiResponse<BookingCardInterface[]>(
            response,
            'Failed to fetch mentor bookings.'
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
        catchError(
          handleApiErrorWithFallback([], 'Failed to fetch mentor bookings')
        )
      );
  }

  approveBooking(
    id: string,
    sessionLink: string
  ): Observable<BookingCardInterface | null> {
    return this.http
      .patch<ApiResponse<BookingCardInterface>>(
        buildApiUrl(`/booking/${id}/approve`),
        { sessionLink }
      )
      .pipe(
        map((response) =>
          validateApiResponse<BookingCardInterface>(
            response,
            'Failed to approve booking.'
          )
        ),
        catchError(
          handleApiErrorWithFallback(null, 'Failed to approve booking')
        )
      );
  }

  rejectBooking(id: string): Observable<BookingCardInterface | null> {
    return this.http
      .patch<ApiResponse<BookingCardInterface>>(
        buildApiUrl(`/booking/${id}/reject`),
        {}
      )
      .pipe(
        map((response) =>
          validateApiResponse<BookingCardInterface>(
            response,
            'Failed to reject booking.'
          )
        ),
        catchError(
          handleApiErrorWithFallback(null, 'Failed to reject booking')
        )
      );
  }

  completeBooking(id: string): Observable<BookingCardInterface | null> {
    return this.http
      .patch<ApiResponse<BookingCardInterface>>(
        buildApiUrl(`/booking/${id}/complete`),
        {}
      )
      .pipe(
        map((response) =>
          validateApiResponse<BookingCardInterface>(
            response,
            'Failed to complete booking.'
          )
        ),
        catchError(
          handleApiErrorWithFallback(null, 'Failed to complete booking')
        )
      );
  }

  updateBooking(
    id: string,
    dto: {
      sessionDateTime?: string;
      status?: BookingStatus;
      sessionLink?: string;
      notes?: string;
    }
  ): Observable<BookingCardInterface | null> {
    return this.http
      .patch<ApiResponse<BookingCardInterface>>(
        buildApiUrl(`/booking/${id}`),
        dto
      )
      .pipe(
        map((response) =>
          validateApiResponse<BookingCardInterface>(
            response,
            'Failed to update booking.'
          )
        ),
        catchError(handleApiErrorWithFallback(null, 'Failed to update booking'))
      );
  }
}
