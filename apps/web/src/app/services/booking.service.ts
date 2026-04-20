import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { buildApiUrl } from '../helpers/api.helper';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  BookingWithUsersInterface,
  BookingSessionCardInterface,
  BookingStatus,
  BookingCardInterface,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import {
  handleApiErrorWithFallback,
  validateApiResponse,
} from '../helpers/api-response.helper';

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

























  //---------------------------------------------------------------------
  getUserBookings(userId: string): Observable<BookingWithUsersInterface[]> {
    return this.http
      .get<ApiResponse<BookingWithUsersInterface[]>>(
        buildApiUrl(`/booking/user/${userId}`)
      )
      .pipe(
        map((response) => {
          if (response.status !== 'success') {
            throw new Error(
              response.message || 'Failed to fetch user bookings.'
            );
          }

          return response.data ?? [];
        }),
        map((bookings) =>
          bookings.map((booking) => ({
            ...booking,
            sessionDateTime: new Date(booking.sessionDateTime),
            createdAt: new Date(booking.createdAt),
            updatedAt: new Date(booking.updatedAt),
          }))
        ),
        catchError((error: HttpErrorResponse | Error) => {
          const message =
            error instanceof HttpErrorResponse
              ? error.error?.message ||
                error.message ||
                'Booking API request failed.'
              : error.message || 'Booking API request failed.';

          console.error('Failed to fetch user bookings:', message, error);

          return of([]);
        })
      );
  }

  getBookingsDetails(userId: string): Observable<BookingWithUsersInterface[]> {
    return this.http
      .get<ApiResponse<BookingWithUsersInterface[]>>(
        buildApiUrl(`/booking/user/${userId}`)
      )
      .pipe(
        map((response) => response.data ?? []),
        map((bookings) =>
          bookings.map((booking) => ({
            ...booking,
            sessionDateTime: new Date(booking.sessionDateTime),
            createdAt: new Date(booking.createdAt),
            updatedAt: new Date(booking.updatedAt),
          }))
        ),
        catchError((error) => {
          console.error('booking api request failed', error);
          return of([]);
        })
      );
  }

  getSessionRequestDetails(
    userId: string
  ): Observable<BookingSessionCardInterface[]> {
    return this.getBookingsDetails(userId).pipe(
      map((bookings) =>
        bookings
          .filter((booking) => booking.menteeId === userId)
          .map((booking) => ({
            id: booking.id,
            mentorId: booking.mentorId,
            mentorName: booking.mentor
              ? `${booking.mentor.firstName} ${booking.mentor.lastName}`
              : 'Unknown Mentor',
            mentorProfilePicture:
              booking.mentor?.avatarAttachments?.[0]?.publicUrl ?? null,
            sessionDateTime: booking.sessionDateTime,
            sessionRating: 0,
            status: booking.status,
            sessionLink: booking.sessionLink ?? null,
            notes: booking.notes ?? null,
            isDeleted: booking.isDeleted,
          }))
      )
    );
  }

  getActiveBookings(userId: string): Observable<BookingSessionCardInterface[]> {
    return this.getSessionRequestDetails(userId).pipe(
      map((bookings) =>
        bookings.filter(
          (booking) =>
            !booking.isDeleted && booking.status !== BookingStatus.DELETED
        )
      )
    );
  }

  getBookingsByStatus(
    userId: string,
    status: BookingStatus
  ): Observable<BookingSessionCardInterface[]> {
    return this.getActiveBookings(userId).pipe(
      map((bookings) => bookings.filter((booking) => booking.status === status))
    );
  }

  getUpcomingSessions(
    userId: string,
    limit = 6
  ): Observable<BookingSessionCardInterface[]> {
    const allowedStatuses = [BookingStatus.PENDING, BookingStatus.APPROVED];

    return this.getActiveBookings(userId).pipe(
      map((bookings) =>
        bookings
          .filter((booking) => allowedStatuses.includes(booking.status))
          .sort(
            (a, b) =>
              new Date(a.sessionDateTime).getTime() -
              new Date(b.sessionDateTime).getTime()
          )
          .slice(0, limit)
      )
    );
  }

  getSessionHistory(
    userId: string,
    limit = 5
  ): Observable<BookingSessionCardInterface[]> {
    return this.getActiveBookings(userId).pipe(
      map((bookings) =>
        bookings
          .filter((booking) => booking.status === BookingStatus.COMPLETED)
          .sort(
            (a, b) =>
              new Date(b.sessionDateTime).getTime() -
              new Date(a.sessionDateTime).getTime()
          )
          .slice(0, limit)
      )
    );
  }

  getNearestApprovedSessionWithLink(
    userId: string
  ): Observable<BookingSessionCardInterface[]> {
    return this.getActiveBookings(userId).pipe(
      map((bookings) => {
        const now = Date.now();

        const nearestBooking = bookings
          .filter(
            (booking) =>
              booking.status === BookingStatus.APPROVED &&
              Boolean(booking.sessionLink?.trim()) &&
              new Date(booking.sessionDateTime).getTime() >= now
          )
          .sort(
            (a, b) =>
              new Date(a.sessionDateTime).getTime() -
              new Date(b.sessionDateTime).getTime()
          )[0];

        return nearestBooking ? [nearestBooking] : [];
      })
    );
  }
}
