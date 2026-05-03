import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { of, switchMap } from 'rxjs';

import {
  BookingCardInterface,
  BookingFilter,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { BookingService } from '../../../services/booking.service';
import { AuthState } from '../../../store/auth';
import { FilterButton } from '../../shared/filter-button/filter-button';
import { SectionCard } from '../../shared/section-card/section-card';
import { SectionTitle } from '../../shared/section-title/section-title';
import { SessionBookingCard } from '../../shared/session-booking-card/session-booking-card';
import { BookingCardListSkeleton } from '../../shared/loaders/booking-card-list-skeleton/booking-card-list-skeleton';

@Component({
  selector: 'app-booking-overview',
  imports: [
    CommonModule,
    BookingCardListSkeleton,
    FilterButton,
    SectionCard,
    SectionTitle,
    SessionBookingCard,
  ],
  templateUrl: './booking-overview.html',
  styleUrl: './booking-overview.scss',
})
export class BookingOverview {
  private readonly bookingService = inject(BookingService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly authUser = this.store.selectSignal(AuthState.user);
  protected readonly userId = computed(() => this.authUser()?.id);
  protected readonly bookingStatus = BookingStatus;
  protected readonly selectedFilter = signal<BookingFilter>('ALL');

  protected readonly fetchBookings = toSignal<BookingCardInterface[] | null>(
    toObservable(this.userId).pipe(
      switchMap((userId) => {
        if (!userId) {
          return of([] as BookingCardInterface[]);
        }

        return this.bookingService.getBookingsByUserId(userId);
      })
    ),
    { initialValue: null }
  );

  protected readonly isBookingsLoading = computed(
    () => this.fetchBookings() === null
  );

  protected readonly bookings = computed<BookingCardInterface[]>(
    () => this.fetchBookings() ?? []
  );

  protected readonly displayedBookings = computed<BookingCardInterface[]>(() => {
    const bookings = this.bookings();
    const filter = this.selectedFilter();

    if (filter === 'ALL') {
      return bookings;
    }

    return bookings.filter((booking) => booking.status === filter);
  });

  protected readonly bookingCounts = computed(() => {
    const bookings = this.bookings();

    return {
      ALL: bookings.length,
      UPCOMING: bookings.filter(
        (booking) => booking.status === BookingStatus.APPROVED
      ).length,
      PENDING: bookings.filter(
        (booking) => booking.status === BookingStatus.PENDING
      ).length,
      CANCELLED: bookings.filter(
        (booking) => booking.status === BookingStatus.CANCELLED
      ).length,
      REJECTED: bookings.filter(
        (booking) => booking.status === BookingStatus.REJECTED
      ).length,
      COMPLETED: bookings.filter(
        (booking) => booking.status === BookingStatus.COMPLETED
      ).length,
    };
  });

  protected setFilter(filter: BookingFilter): void {
    this.selectedFilter.set(filter);
  }

  protected onViewDetails(booking: BookingCardInterface): void {
    void this.router.navigate(['/mentee/booking-overview'], {
      queryParams: { bookingId: booking.id },
    });
  }

  protected onCancelRequest(booking: BookingCardInterface): void {
    void this.router.navigate(['/mentee/booking-overview'], {
      queryParams: { bookingId: booking.id, action: 'cancel' },
    });
  }

  protected onAddReview(booking: BookingCardInterface): void {
    void this.router.navigate(['/mentee/booking-overview'], {
      queryParams: { bookingId: booking.id, action: 'review' },
    });
  }
}
