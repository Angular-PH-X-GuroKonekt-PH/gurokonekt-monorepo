import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output, signal, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  BookingCardInterface,
  BookingUserSummaryInterface,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { Pagination } from '@gurokonekt/ui';

import { IconComponent, IconName } from '../icon/icon.component';
import { BookingTableSkeleton } from '../skeleton-loaders/booking-table-skeleton/booking-table-skeleton.component';
import {
  BookingCounterparty,
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
    DatePipe,
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

  sortedBookings = computed(() => {
    const bookings = this.bookings() ?? [];
    const sortKey = this.sortKey();

    if (!sortKey) {
      return bookings;
    }

    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return [...bookings].sort((first, second) => {
      let comparison = 0;

      if (sortKey === 'counterparty') {
        comparison = this.getCounterpartyName(first).localeCompare(
          this.getCounterpartyName(second),
          undefined,
          { sensitivity: 'base' },
        );
      } else if (sortKey === 'sessionDateTime') {
        comparison =
          new Date(first.sessionDateTime).getTime() -
          new Date(second.sessionDateTime).getTime();
      } else {
        comparison = first.status.localeCompare(second.status, undefined, {
          sensitivity: 'base',
        });
      }

      return comparison * direction;
    });
  });

  displayedBookings = computed(() => {
    const maxRows = this.maxRows();

    return maxRows === null
      ? this.sortedBookings()
      : this.sortedBookings().slice(0, Math.max(0, maxRows));
  });

  sortBy(key: BookingSortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.update((direction) =>
        direction === 'asc' ? 'desc' : 'asc',
      );
      return;
    }

    this.sortKey.set(key);
    this.sortDirection.set('asc');
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
      4 +
      (this.showMenteeNotes() ? 1 : 0) +
      (this.showMentorNotes() ? 1 : 0)
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
    booking: BookingCardInterface
  ): BookingUserSummaryInterface | null {
    return this.counterparty() === 'mentor'
      ? booking.mentor ?? null
      : booking.mentee ?? null;
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
}
