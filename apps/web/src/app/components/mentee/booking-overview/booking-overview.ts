import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { of, switchMap } from 'rxjs';

import { BookingService } from '../../../services/booking.service';
import { AuthState } from '../../../store/auth';
import {
  BookingFilter,
  BookingSessionCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { FilterButton } from '../../shared/filter-button/filter-button';
import { SectionTitle } from '../../shared/section-title/section-title';
import { SessionBookingCard } from '../../shared/session-booking-card/session-booking-card';
import { SectionCard } from '../../shared/section-card/section-card';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-booking-overview',
  imports: [
    SectionTitle,
    CommonModule,
    SessionBookingCard,
    FilterButton,
    SectionCard,
    IconComponent
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


  protected readonly fetchBookings = toSignal<BookingSessionCardInterface[] | null>(
    toObservable(this.userId).pipe(
      switchMap((userId) => {
        if (!userId) {
          return of([] as BookingSessionCardInterface[]);
        }

        return this.bookingService.getActiveBookings(userId);
      })
    ),
    { initialValue: null }
  );

  protected readonly isBookingsLoading = computed(() => this.fetchBookings() === null);
  protected readonly displayedBookings = computed(() => {
    const bookings = this.fetchBookings() ?? [];
    const filter = this.selectedFilter();

    if (filter === 'ALL') {
      return bookings;
    }

    return bookings.filter((booking) => booking.status === filter);
  });
  protected readonly upcomingBooking = computed(() => {
    const now = Date.now();

    return [...(this.fetchBookings() ?? [])]
      .filter(
        (booking) =>
          booking.status === BookingStatus.APPROVED &&
          new Date(booking.sessionDateTime).getTime() >= now
      )
      .sort(
        (firstBooking, secondBooking) =>
          new Date(firstBooking.sessionDateTime).getTime() -
          new Date(secondBooking.sessionDateTime).getTime()
      )[0] ?? null;
  });

  protected readonly bookingCounts = computed(() => {
    const bookings = this.fetchBookings() ?? [];

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

  protected getUpcomingBookingTitle(booking: BookingSessionCardInterface): string {
    if (booking.notes?.trim()) {
      return booking.notes.trim();
    }

    return 'Upcoming mentoring session';
  }

  protected getUpcomingBookingDateTime(booking: BookingSessionCardInterface): string {
    const sessionDate = new Date(booking.sessionDateTime);

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(sessionDate);
  }

  protected openSessionLink(sessionLink: string): void {
    window.open(sessionLink, '_blank', 'noopener,noreferrer');
  }

  protected onViewDetails(booking: BookingSessionCardInterface): void {
    void this.router.navigate(['/mentee/booking-overview'], {
      queryParams: { bookingId: booking.id },
    });
  }
}
