import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import {
  BookingCardInterface,
  BookingStatus,
  BookingTab,
  BookingListResponse,
  BookingSortBy,
  BookingSortOrder,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { MentorDashboardLoadState } from '@gurokonekt/models';

import { AuthSelectors } from '../../../core/auth/store/auth.selectors';
import { BookingService } from '../../../shared/services/booking.service';
import { MentorDashboardService } from './mentor-dashboard.service';

@Injectable({
  providedIn: 'root',
})
export class MentorBookingService {
  store = inject(Store);
  bookingService = inject(BookingService);
  private readonly mentorDashboardService = inject(MentorDashboardService);

  authUser = this.store.selectSignal(AuthSelectors.user);
  userId = computed(() => this.authUser()?.id);

  private readonly requestedPage = signal(1);
  private readonly requestedPageSize = signal(10);
  private readonly requestedStatus = signal<BookingStatus | undefined>(
    undefined
  );
  private readonly requestedSortBy = signal<BookingSortBy>('sessionDateTime');
  private readonly requestedSortOrder = signal<BookingSortOrder>('asc');

  readonly pageSize = computed(() => this.requestedPageSize());

  private readonly bookingQuery = computed(() => ({
    userId: this.userId(),
    page: this.requestedPage(),
    limit: this.requestedPageSize(),
    status: this.requestedStatus(),
    sortBy: this.requestedSortBy(),
    sortOrder: this.requestedSortOrder(),
  }));

  bookingPage = toSignal<BookingListResponse | null>(
    toObservable(this.bookingQuery).pipe(
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

        return this.bookingService
          .getMentorBookings({ page, limit, status, sortBy, sortOrder })
          .pipe(startWith(null));
      })
    ),
    { initialValue: null }
  );

  private readonly dashboardState = toSignal<
    MentorDashboardLoadState,
    MentorDashboardLoadState
  >(
    toObservable(this.userId).pipe(
      switchMap((userId): Observable<MentorDashboardLoadState> => {
        if (!userId) {
          return of({ status: 'idle', data: null });
        }

        return this.mentorDashboardService.getDashboard(userId).pipe(
          map(
            (data): MentorDashboardLoadState => ({ status: 'loaded', data }),
          ),
          startWith<MentorDashboardLoadState>({
            status: 'loading',
            data: null,
          }),
          catchError(() =>
            of<MentorDashboardLoadState>({ status: 'error', data: null }),
          ),
        );
      }),
    ),
    { initialValue: { status: 'idle', data: null } },
  );

  dashboard = computed(() => this.dashboardState().data);
  isDashboardLoading = computed(
    () => this.dashboardState().status === 'loading',
  );
  hasDashboardError = computed(
    () => this.dashboardState().status === 'error',
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
    () => this.dashboard()?.quickStats.pendingBookingRequestsCount ?? 0,
  );

  upcomingSessions = computed(
    () => this.dashboard()?.quickStats.upcomingSessions ?? 0,
  );

  totalCompleted = computed(
    () => this.dashboard()?.quickStats.totalCompletedSessions ?? 0,
  );

  upcomingSession = computed(() => this.dashboard()?.nextUpcomingSession ?? null);

  setPage(page: number): void {
    this.requestedPage.set(Math.max(1, page));
  }

  setPageSize(pageSize: number): void {
    this.requestedPageSize.set(Math.max(1, pageSize));
    this.requestedPage.set(1);
  }

  setActiveTab(tab: BookingTab): void {
    this.requestedStatus.set(
      tab === 'All' ? undefined : (tab.toUpperCase() as BookingStatus)
    );
    this.requestedPage.set(1);
  }

  setSort(sortBy: BookingSortBy, sortOrder: BookingSortOrder): void {
    this.requestedSortBy.set(sortBy);
    this.requestedSortOrder.set(sortOrder);
    this.requestedPage.set(1);
  }

  resetPagination(): void {
    this.requestedStatus.set(undefined);
    this.requestedPage.set(1);
    this.requestedPageSize.set(10);
    this.requestedSortBy.set('sessionDateTime');
    this.requestedSortOrder.set('asc');
  }
}
