import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  BookingCardInterface,
  BookingUserSummaryInterface,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { Pagination } from '@gurokonekt/ui';
import { formatDateInTimezone, formatTimeInTimezone } from '@gurokonekt/utils';

import { IconComponent, IconName } from '../icon/icon.component';
import { BookingTableSkeleton } from '../skeleton-loaders/booking-table-skeleton/booking-table-skeleton.component';
import {
  BookingCounterparty,
  BookingSortChange,
  BookingSortKey,
  BookingTableFooterMode,
  SortDirection,
} from './bookings-table.types';

export interface BookingActionContext {
  $implicit: BookingCardInterface;
}

@Component({
  selector: 'app-bookings-table',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    IconComponent,
    BookingTableSkeleton,
    Pagination,
  ],
  templateUrl: './bookings-table.html',
})
export class BookingsTable {
  title = input('Recent Bookings');
  tabs = input<string[]>([]);
  activeTab = input('All');
  bookings = input<BookingCardInterface[] | null>(null);
  isLoading = input(false);
  counterparty = input<BookingCounterparty>('mentee');
  showMenteeNotes = input(true);
  showMentorNotes = input(false);
  actionsTemplate = input<TemplateRef<BookingActionContext> | null>(null);
  displayTimezone = input(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );

  footerMode = input<BookingTableFooterMode>('none');
  maxRows = input<number | null>(null);
  viewAllLink = input('/booking-overview');

  currentPage = input(1);
  pageSize = input(10);
  totalItems = input(0);
  pageSizeOptions = input<number[]>([10, 20, 50]);

  protected readonly sortKey = signal<BookingSortKey | null>(null);
  protected readonly sortDirection = signal<SortDirection>('asc');

  tabChange = output<string>();
  pageChange = output<number>();
  pageSizeChange = output<number>();
  sortChange = output<BookingSortChange>();

  sortedBookings = computed(() => {
    const bookings = this.bookings() ?? [];
    const sortKey = this.sortKey();

    if (this.footerMode() === 'pagination' || !sortKey) {
      return bookings;
    }

    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return [...bookings].sort((first, second) => {
      if (sortKey === 'counterparty') {
        const firstName = this.getCounterpartyName(first);
        const secondName = this.getCounterpartyName(second);

        return (
          firstName.localeCompare(secondName, undefined, {
            sensitivity: 'base',
          }) * direction
        );
      }

      if (sortKey === 'sessionDateTime') {
        return (
          (new Date(first.sessionDateTime).getTime() -
            new Date(second.sessionDateTime).getTime()) *
          direction
        );
      }

      return (
        first.status.localeCompare(second.status, undefined, {
          sensitivity: 'base',
        }) * direction
      );
    });
  });

  displayedBookings = computed(() => {
    const maxRows = this.maxRows();
    const bookings = this.sortedBookings();

    return maxRows === null
      ? bookings
      : bookings.slice(0, Math.max(0, maxRows));
  });

  private readonly cachedBookings = signal<BookingCardInterface[]>([]);
  private readonly cachedTotalItems = signal(0);

  protected readonly skeletonRowCount = computed(() => {
    const rowLimit = this.maxRows() ?? this.pageSize();

    return Math.max(1, Math.min(5, rowLimit));
  });

  protected readonly hasCachedBookings = computed(
    () => this.cachedBookings().length > 0,
  );

  protected readonly bookingsToRender = computed(() =>
    this.isLoading() && this.hasCachedBookings()
      ? this.cachedBookings()
      : this.displayedBookings(),
  );

  protected readonly paginationTotalItems = computed(() =>
    this.isLoading() && this.hasCachedBookings()
      ? this.cachedTotalItems()
      : this.totalItems(),
  );

  constructor() {
    effect(() => {
      if (!this.isLoading()) {
        this.cachedBookings.set(this.displayedBookings());
        this.cachedTotalItems.set(this.totalItems());
      }
    });
  }

  sortBy(key: BookingSortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.update((direction) =>
        direction === 'asc' ? 'desc' : 'asc',
      );
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }

    if (this.footerMode() === 'pagination') {
      this.sortChange.emit({ key, direction: this.sortDirection() });
    }
  }

  getSortDirection(key: BookingSortKey): string {
    if (this.sortKey() !== key) {
      return 'none';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  getSortIconName(key: BookingSortKey): IconName {
    if (this.sortKey() !== key) {
      return 'sort-none';
    }

    return this.sortDirection() === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  tableColumnCount = computed(
    () =>
      4 + (this.showMenteeNotes() ? 1 : 0) + (this.showMentorNotes() ? 1 : 0),
  );

  selectTab(tab: string): void {
    if (tab !== this.activeTab()) {
      this.tabChange.emit(tab);
    }
  }

  changePageSize(event: Event): void {
    const pageSize = Number((event.target as HTMLSelectElement).value);

    if (Number.isFinite(pageSize) && pageSize > 0) {
      this.pageSizeChange.emit(pageSize);
    }
  }

  getCounterparty(
    booking: BookingCardInterface,
  ): BookingUserSummaryInterface | null {
    return this.counterparty() === 'mentor'
      ? (booking.mentor ?? null)
      : (booking.mentee ?? null);
  }

  getCounterpartyLabel(): string {
    return this.counterparty() === 'mentor' ? 'Mentor' : 'Mentee';
  }

  private getCounterpartyName(booking: BookingCardInterface): string {
    const participant = this.getCounterparty(booking);

    return participant
      ? `${participant.firstName} ${participant.lastName}`.trim()
      : '';
  }

  protected formatBookingDate(date: Date | string): string {
    return formatDateInTimezone(date, this.displayTimezone());
  }

  protected formatBookingTime(date: Date | string): string {
    return formatTimeInTimezone(date, this.displayTimezone());
  }
}
