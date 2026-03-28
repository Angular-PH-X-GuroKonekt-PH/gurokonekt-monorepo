import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BookingInterface,
  BookingSessionCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { MentorService } from './mentor.service';

@Injectable({
  providedIn: 'root',
})

export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly mentorService = inject(MentorService);

  private useMock = true;

  getBookingsDetails(userId: string): Observable<BookingInterface[]> {
    return this.useMock
      ? of(this.mockData)
      : this.http.get<BookingInterface[]>(`/api/booking/user/${userId}`);
  }

getSessionRequestDetails(userId: string): Observable<BookingSessionCardInterface[]> {
  return this.getBookingsDetails(userId).pipe(
    map((bookings: BookingInterface[]) =>
      bookings.filter((booking) => booking.menteeId === userId)
    ),
    switchMap((bookings: BookingInterface[]) => {
      if (!bookings.length) {
        return of([]);
      }

      const bookingCards$ = bookings.map((booking) =>
        this.mentorService.getMentorProfileById(booking.mentorId).pipe(
          map((mentor) => {
            return {
              id: booking.id,
              mentorId: booking.mentorId,
              mentorName: mentor
                ? `${mentor.user.firstName} ${mentor.user.lastName}`
                : 'Unknown Mentor',
              mentorProfilePicture:
                mentor?.user.avatarAttachments?.publicUrl ?? null,
              sessionDateTime: booking.sessionDateTime,
              sessionRating: 0,
              status: booking.status,
              sessionLink: booking.sessionLink ?? null,
              notes: booking.notes ?? null,
              isDeleted: booking.isDeleted,
            };
          })
        )
      );

      return forkJoin(bookingCards$);
    })
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

  getUpcomingSessions(userId: string, limit = 6): Observable<BookingSessionCardInterface[]> {
    const allowedStatuses = [BookingStatus.PENDING, BookingStatus.APPROVED];

    return this.getActiveBookings(userId).pipe(
      map((bookings) =>
        bookings
          .filter(
            (booking) => allowedStatuses.includes(booking.status)
          )
          .sort(
            (a, b) =>
              new Date(a.sessionDateTime).getTime() -
              new Date(b.sessionDateTime).getTime()
          )
          .slice(0, limit)
      )
    );
  }

  getSessionHistory(userId: string, limit = 5): Observable<BookingSessionCardInterface[]> {
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

getNearestApprovedSessionWithLink(userId: string): Observable<BookingSessionCardInterface[]> {
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

private mockData: BookingInterface[] = [
  {
    id: '1',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-1',
    sessionDateTime: new Date('2026-03-20T10:00:00+08:00'),
    status: BookingStatus.PENDING,
    sessionLink: '',
    notes: 'Discuss Angular basics',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-2',
    sessionDateTime: new Date('2026-03-26T14:00:00+08:00'),
    status: BookingStatus.APPROVED,
    sessionLink: 'https://meet.google.com/sample',
    notes: '',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-3',
    sessionDateTime: new Date('2026-03-15T09:00:00+08:00'),
    status: BookingStatus.COMPLETED,
    sessionLink: '',
    notes: 'Reviewed architecture',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-4',
    sessionDateTime: new Date('2026-03-10T13:30:00+08:00'),
    status: BookingStatus.CANCELLED,
    sessionLink: '',
    notes: '',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-5',
    sessionDateTime: new Date('2026-03-22T16:00:00+08:00'),
    status: BookingStatus.PENDING,
    sessionLink: '',
    notes: '',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-6',
    sessionDateTime: new Date('2026-03-19T11:00:00+08:00'),
    status: BookingStatus.APPROVED,
    sessionLink: 'https://zoom.us/sample',
    notes: '',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '7',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-7',
    sessionDateTime: new Date('2026-03-12T15:00:00+08:00'),
    status: BookingStatus.REJECTED,
    sessionLink: '',
    notes: '',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '8',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-8',
    sessionDateTime: new Date('2026-03-08T08:00:00+08:00'),
    status: BookingStatus.COMPLETED,
    sessionLink: '',
    notes: '',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '9',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-9',
    sessionDateTime: new Date('2026-03-25T17:00:00+08:00'),
    status: BookingStatus.PENDING,
    sessionLink: '',
    notes: '',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '10',
    menteeId: '259f2a25-c180-4609-a603-6d60ba04e69a',
    mentorId: 'mentor-10',
    sessionDateTime: new Date('2026-03-05T10:30:00+08:00'),
    status: BookingStatus.COMPLETED,
    sessionLink: '',
    notes: '',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

}
