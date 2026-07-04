import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { of, startWith, switchMap } from 'rxjs';

import {
  BookingCardInterface,
  BookingStatus,
  BookingTab,
  UpcomingSession,
  BookingListResponse
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { AuthSelectors } from '../../../core/auth/store/auth.selectors';
import { BookingService } from '../../../shared/services/booking.service';

@Injectable({
  providedIn: 'root',
})
export class MentorBookingService {
  store = inject(Store);
  bookingService = inject(BookingService);

  authUser = this.store.selectSignal(AuthSelectors.user);
  userId = computed(() => this.authUser()?.id);

  private readonly requestedPage = signal(1);
  private readonly requestedStatus = signal<BookingStatus | undefined>(
    undefined
  );

  readonly pageSize = 10;

  private readonly bookingQuery = computed(() => ({
    userId: this.userId(),
    page: this.requestedPage(),
    status: this.requestedStatus(),
  }));

  bookingPage = toSignal<BookingListResponse | null>(
    toObservable(this.bookingQuery).pipe(
      switchMap(({ userId, page, status }) => {
        if (!userId) {
          return of<BookingListResponse>({
            data: [],
            total: 0,
            page,
            limit: this.pageSize,
            totalPages: 0,
          });
        }

        return this.bookingService
          .getMentorBookings({ page, limit: this.pageSize, status })
          .pipe(startWith(null));
      })
    ),
    { initialValue: null }
  );

  bookings = computed<BookingCardInterface[] | null>(
    () => this.bookingPage()?.data ?? null
  );

  isBookingsLoading = computed(() => this.bookingPage() === null);
  currentPage = computed(
    () => this.bookingPage()?.page ?? this.requestedPage()
  );
  totalBookings = computed(() => this.bookingPage()?.total ?? 0);
  totalPages = computed(() => this.bookingPage()?.totalPages ?? 0);

  pendingRequests = computed(
    () => (this.bookings() ?? []).filter((b) => b.status === BookingStatus.PENDING).length
  );

  upcomingSessions = computed(
    () => (this.bookings() ?? []).filter((b) => b.status === BookingStatus.APPROVED).length
  );

  totalCompleted = computed(
    () => (this.bookings() ?? []).filter((b) => b.status === BookingStatus.COMPLETED).length
  );

  upcomingSession = computed<UpcomingSession | null>(() => {
    const now = new Date();

    const nextBooking = (this.bookings() ?? [])
      .filter(
        (booking) =>
          booking.status === BookingStatus.APPROVED &&
          new Date(booking.sessionDateTime) > now
      )
      .sort(
        (a, b) =>
          new Date(a.sessionDateTime).getTime() -
          new Date(b.sessionDateTime).getTime()
      )[0];

    if (!nextBooking) return null;

    return {
      title: nextBooking.notes || 'Mentoring Session',
      mentor: nextBooking.mentee
        ? `${nextBooking.mentee.firstName} ${nextBooking.mentee.lastName}`
        : 'Mentee',
      dateTime: new Date(nextBooking.sessionDateTime).toLocaleString(),
      sessionLink: nextBooking.sessionLink,
    };
  });

  setPage(page: number): void {
    this.requestedPage.set(Math.max(1, page));
  }

  setActiveTab(tab: BookingTab): void {
    this.requestedStatus.set(
      tab === 'All' ? undefined : (tab.toUpperCase() as BookingStatus)
    );
    this.requestedPage.set(1);
  }

  resetPagination(): void {
    this.requestedStatus.set(undefined);
    this.requestedPage.set(1);
  }
}
