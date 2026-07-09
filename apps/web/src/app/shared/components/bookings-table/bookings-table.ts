import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  BookingCardInterface,
  BookingUserSummaryInterface,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { Pagination } from '@gurokonekt/ui';

import { BookingTableSkeleton } from '../skeleton-loaders/booking-table-skeleton/booking-table-skeleton.component';

export type BookingTableFooterMode = 'pagination' | 'viewAll' | 'none';
export type BookingCounterparty = 'mentor' | 'mentee';

export interface BookingActionContext {
  $implicit: BookingCardInterface;
}

@Component({
  selector: 'app-bookings-table',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
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
  actionsTemplate = input<TemplateRef<BookingActionContext> | null>(null);

  footerMode = input<BookingTableFooterMode>('none');
  maxRows = input<number | null>(null);
  viewAllLink = input('/booking-overview');

  currentPage = input(1);
  pageSize = input(10);
  totalItems = input(0);
  pageSizeOptions = input<number[]>([10, 20, 50]);

  tabChange = output<string>();
  pageChange = output<number>();
  pageSizeChange = output<number>();

  displayedBookings = computed(() => {
    const bookings = this.bookings() ?? [];
    const maxRows = this.maxRows();

    return maxRows === null
      ? bookings
      : bookings.slice(0, Math.max(0, maxRows));
  });

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
}
