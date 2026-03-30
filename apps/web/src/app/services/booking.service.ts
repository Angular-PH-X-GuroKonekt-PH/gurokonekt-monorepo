import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

import { buildApiUrl } from '../helpers/api.helper';
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  BookingWithUsersInterface,
  BookingSessionCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly useMock = true;

  getBookingsDetails(userId: string): Observable<BookingWithUsersInterface[]> {
    if (this.useMock) {
      return of(this.buildMockBookings(userId));
    }

    return this.http
      .get<ApiResponse<BookingWithUsersInterface[]>>(
        buildApiUrl(`/booking/user/${userId}`)
      )
      .pipe(map((response) => response.data ?? []));
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

  private buildMockBookings(userId: string): BookingWithUsersInterface[] {
    const now = new Date();

    return [
      {
        id: 'book-mock-001',
        menteeId: userId,
        mentorId: 'mentor-user-001',
        sessionDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 2,
          10,
          0
        ),
        status: BookingStatus.APPROVED,
        sessionLink: 'https://meet.google.com/mock-session-001',
        notes:
          'Discuss Angular dashboard architecture and booking overview UI.',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        mentor: {
          id: 'mentor-user-001',
          firstName: 'Andrea',
          lastName: 'Ramos',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=12',
            },
          ],
        },
        mentee: {
          id: userId,
          firstName: 'Daniel',
          lastName: 'Mengote',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=15',
            },
          ],
        },
      },
      {
        id: 'book-mock-002',
        menteeId: userId,
        mentorId: 'mentor-user-002',
        sessionDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 4,
          14,
          30
        ),
        status: BookingStatus.PENDING,
        sessionLink: undefined,
        notes: 'Need help with API response mapping and RxJS streams.',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        mentor: {
          id: 'mentor-user-002',
          firstName: 'Miguel',
          lastName: 'Santos',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=33',
            },
          ],
        },
        mentee: {
          id: userId,
          firstName: 'Daniel',
          lastName: 'Mengote',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=15',
            },
          ],
        },
      },
      {
        id: 'book-mock-003',
        menteeId: userId,
        mentorId: 'mentor-user-003',
        sessionDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 6,
          9,
          0
        ),
        status: BookingStatus.COMPLETED,
        sessionLink: undefined,
        notes: 'Completed frontend architecture review session.',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        mentor: {
          id: 'mentor-user-003',
          firstName: 'Patricia',
          lastName: 'Reyes',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=47',
            },
          ],
        },
        mentee: {
          id: userId,
          firstName: 'Daniel',
          lastName: 'Mengote',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=15',
            },
          ],
        },
      },
      {
        id: 'book-mock-004',
        menteeId: userId,
        mentorId: 'mentor-user-001',
        sessionDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 8,
          13,
          0
        ),
        status: BookingStatus.CANCELLED,
        sessionLink: undefined,
        notes: 'Cancelled because of schedule conflict.',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        mentor: {
          id: 'mentor-user-001',
          firstName: 'Andrea',
          lastName: 'Ramos',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=12',
            },
          ],
        },
        mentee: {
          id: userId,
          firstName: 'Daniel',
          lastName: 'Mengote',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=15',
            },
          ],
        },
      },
      {
        id: 'book-mock-005',
        menteeId: userId,
        mentorId: 'mentor-user-002',
        sessionDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 10,
          15,
          30
        ),
        status: BookingStatus.REJECTED,
        sessionLink: undefined,
        notes: 'Mentor was unavailable for the requested slot.',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        mentor: {
          id: 'mentor-user-002',
          firstName: 'Miguel',
          lastName: 'Santos',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=33',
            },
          ],
        },
        mentee: {
          id: userId,
          firstName: 'Daniel',
          lastName: 'Mengote',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=15',
            },
          ],
        },
      },
      {
        id: 'book-mock-006',
        menteeId: userId,
        mentorId: 'mentor-user-003',
        sessionDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 7,
          8,
          30
        ),
        status: BookingStatus.APPROVED,
        sessionLink: 'https://zoom.us/j/mock-session-002',
        notes: 'Follow-up session for dashboard filtering and booking flow.',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        mentor: {
          id: 'mentor-user-003',
          firstName: 'Patricia',
          lastName: 'Reyes',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=47',
            },
          ],
        },
        mentee: {
          id: userId,
          firstName: 'Daniel',
          lastName: 'Mengote',
          avatarAttachments: [
            {
              publicUrl: 'https://i.pravatar.cc/300?img=15',
            },
          ],
        },
      },
    ];
  }

}
