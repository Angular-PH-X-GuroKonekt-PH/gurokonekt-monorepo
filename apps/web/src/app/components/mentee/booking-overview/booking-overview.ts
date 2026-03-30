import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { BehaviorSubject, combineLatest, map, of, switchMap } from 'rxjs';

import { BookingService } from '../../../services/booking.service';
import { AuthState } from '../../../store/auth';
import {
  BookingFilter,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { FilterButton } from '../../shared/filter-button/filter-button';
import { SectionTitle } from '../../shared/section-title/section-title';
import { SessionBookingCard } from '../../shared/session-booking-card/session-booking-card';

type BookingSortOption = 'DATE_ASC' | 'NAME_ASC';

@Component({
  selector: 'app-booking-overview',
  imports: [
    SectionTitle,
    CommonModule,
    SessionBookingCard,
    FilterButton,
  ],
  templateUrl: './booking-overview.html',
  styleUrl: './booking-overview.scss',
})
export class BookingOverview {
  private readonly bookingService = inject(BookingService);
  private readonly store = inject(Store);

  protected readonly authUser = this.store.selectSignal(AuthState.user);

  bookingStatus = BookingStatus;
  selectedFilter: BookingFilter = 'ALL';
  selectedSort: BookingSortOption = 'DATE_ASC';

  private readonly selectedFilterSubject = new BehaviorSubject<BookingFilter>(
    'ALL'
  );
  private readonly selectedSortSubject = new BehaviorSubject<BookingSortOption>(
    'DATE_ASC'
  );

  readonly selectedFilter$ = this.selectedFilterSubject.asObservable();
  readonly selectedSort$ = this.selectedSortSubject.asObservable();

  readonly bookings$ = of(this.authUser()).pipe(
    switchMap((user) => {
      const userId = user?.id;

      if (!userId) {
        return of([]);
      }

      return this.bookingService.getActiveBookings(userId);
    })
  );

  readonly bookingOverviewData$ = combineLatest([
    this.bookings$,
    this.selectedFilter$,
    this.selectedSort$,
  ]).pipe(
    map(([bookings, filter, sort]) => {
      const now = Date.now();

      const nearestApprovedSession = bookings
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
        )
        .slice(0, 1);

      const filteredBookings =
        filter === 'ALL'
          ? bookings
          : filter === BookingStatus.APPROVED
            ? bookings.filter(
                (booking) =>
                  booking.status === BookingStatus.APPROVED &&
                  new Date(booking.sessionDateTime).getTime() >= now
              )
            : bookings.filter((booking) => booking.status === filter);

      const sortedBookings = [...filteredBookings].sort((a, b) => {
        if (sort === 'NAME_ASC') {
          return a.mentorName.localeCompare(b.mentorName);
        }

        return (
          new Date(a.sessionDateTime).getTime() -
          new Date(b.sessionDateTime).getTime()
        );
      });

      return {
        nearestApprovedSession,
        filteredBookings: sortedBookings,
        counts: {
          ALL: bookings.length,
          UPCOMING: bookings.filter(
            (booking) =>
              booking.status === BookingStatus.APPROVED &&
              new Date(booking.sessionDateTime).getTime() >= now
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
        },
      };
    })
  );

  setFilter(filter: BookingFilter): void {
    this.selectedFilter = filter;
    this.selectedFilterSubject.next(filter);
  }

  setSort(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const sort = (target?.value ?? 'DATE_ASC') as BookingSortOption;

    this.selectedSort = sort;
    this.selectedSortSubject.next(sort);
  }
}
