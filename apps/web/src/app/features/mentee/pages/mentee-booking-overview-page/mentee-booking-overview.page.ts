import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom, of, switchMap } from 'rxjs';

import {
  BookingCardInterface,
  BookingListResponse,
  BookingSortBy,
  BookingSortOrder,
  BookingStatus,
  BookingTab,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { BookingService } from '../../../../shared/services/booking.service';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';
import { SectionCard } from '../../../../shared/components/section-card/section-card.component';
import { SectionTitle } from '../../../../shared/components/section-title/section-title.component';
import { MenteeBookingsTable } from '../../components/mentee-bookings-table/mentee-bookings-table';
import { ReviewService } from '../../services/review.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CreateReviewRequest } from '@gurokonekt/models';
import { MenteeReviewModal } from "../../components/mentee-bookings-table/mentee-review-modal/mentee-review-modal";
import { BookingSortChange } from '../../../../shared/components/bookings-table/bookings-table.types';

@Component({
  selector: 'app-mentee-booking-overview-page',
  imports: [CommonModule, MenteeBookingsTable, SectionCard, SectionTitle, MenteeReviewModal],
  templateUrl: './mentee-booking-overview.page.html',
})
export class MenteeBookingOverviewPage {
  private readonly bookingService = inject(BookingService);
  private readonly reviewService = inject(ReviewService);
  private readonly toastService = inject(ToastService);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly authUser = this.store.selectSignal(AuthSelectors.user);
  protected readonly userId = computed(() => this.authUser()?.id);

  protected readonly selectedReviewBooking = signal<BookingCardInterface | null>(null);
  protected readonly isSubmittingReview = signal(false);

  protected readonly initialBookingId =
    this.route.snapshot.queryParamMap.get('bookingId');
  protected readonly initialTab: BookingTab =
    this.route.snapshot.queryParamMap.get('tab') === 'Completed'
      ? 'Completed'
      : 'All';
  private readonly bookingRefresh = signal(0);
  private readonly requestedPage = signal(1);
  private readonly requestedPageSize = signal(10);
  private readonly requestedStatus = signal<BookingStatus | undefined>(
    this.initialTab === 'All'
      ? undefined
      : (this.initialTab.toUpperCase() as BookingStatus),
  );
  private readonly requestedSortBy = signal<BookingSortBy>('sessionDateTime');
  private readonly requestedSortOrder = signal<BookingSortOrder>('asc');
  private readonly bookingRequest = computed(() => ({
    userId: this.userId(),
    refresh: this.bookingRefresh(),
    page: this.requestedPage(),
    limit: this.requestedPageSize(),
    status: this.requestedStatus(),
    sortBy: this.requestedSortBy(),
    sortOrder: this.requestedSortOrder(),
  }));

  protected readonly fetchBookings = toSignal<BookingListResponse | null>(
    toObservable(this.bookingRequest).pipe(
      switchMap(({ userId, page, limit, status, sortBy, sortOrder }) => {
        if (!userId) {
          return of<BookingListResponse>({
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
          });
        }

        return this.bookingService.getPaginatedBookingsByUserId(userId, {
          page,
          limit,
          status,
          sortBy,
          sortOrder,
        });
      }),
    ),
    { initialValue: null },
  );

  protected readonly isBookingsLoading = computed(
    () => this.fetchBookings() === null,
  );

  protected readonly bookings = computed<BookingCardInterface[]>(
    () => this.fetchBookings()?.data ?? [],
  );

  protected readonly currentPage = computed(
    () => this.fetchBookings()?.page ?? this.requestedPage(),
  );
  protected readonly pageSize = computed(() => this.requestedPageSize());
  protected readonly totalBookings = computed(
    () => this.fetchBookings()?.total ?? 0,
  );

  protected refreshBookings(): void {
    this.bookingRefresh.update((value) => value + 1);
  }

  protected setPage(page: number): void {
    this.requestedPage.set(Math.max(1, page));
  }

  protected setPageSize(pageSize: number): void {
    this.requestedPageSize.set(Math.max(1, pageSize));
    this.requestedPage.set(1);
  }

  protected setActiveTab(tab: BookingTab): void {
    this.requestedStatus.set(
      tab === 'All' ? undefined : (tab.toUpperCase() as BookingStatus),
    );
    this.requestedPage.set(1);
  }

  protected setSort(sort: BookingSortChange): void {
    this.requestedSortBy.set(
      sort.key === 'counterparty' ? 'mentor' : sort.key,
    );
    this.requestedSortOrder.set(sort.direction);
    this.requestedPage.set(1);
  }



  //REVIEW 

protected onAddReview(booking: BookingCardInterface): void {
  this.selectedReviewBooking.set(booking);
}

protected closeReviewModal(): void {
  this.selectedReviewBooking.set(null);
}

protected async submitReview(request: CreateReviewRequest): Promise<void> {
  this.isSubmittingReview.set(true);

  try {
    await firstValueFrom(this.reviewService.createReview(request));

    this.toastService.success(
      'Your review has been submitted successfully.',
      'Review Submitted'
    );

    this.closeReviewModal();
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : 'Unable to submit review.';

    this.toastService.error(message, 'Review Failed');
  } finally {
    this.isSubmittingReview.set(false);
  }
}
}
