// booking-table.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BookingManagementService, BookingListItem, BookingsQueryParams } from '../../services/booking-management.service';
import { ViewBookingDetailModalComponent } from '../modals/view-booking-detail-modal/view-booking-detail-modal';
import { ForceCancelBookingModalComponent } from '../modals/force-cancel-booking-modal/force-cancel-booking-modal';

@Component({
  selector: 'app-booking-table',
  imports: [DatePipe, ViewBookingDetailModalComponent, ForceCancelBookingModalComponent],
  templateUrl: './booking-table.html',
})
export class BookingTableComponent implements OnInit {
  private readonly bookingService = inject(BookingManagementService);

  protected bookings = signal<BookingListItem[]>([]);
  protected isLoading = signal(false);
  protected total = signal(0);
  protected totalPages = signal(0);

  protected statusFilter = signal<string>('');
  protected searchQuery = signal('');
  protected dateFrom = signal('');
  protected dateTo = signal('');
  protected sortBy = signal<'sessionDateTime' | 'createdAt'>('createdAt');
  protected sortOrder = signal<'asc' | 'desc'>('desc');
  protected page = signal(1);
  protected readonly limit = 20;

  protected openDropdownId = signal<string | null>(null);

  protected selectedBooking = signal<BookingListItem | null>(null);
  protected showDetailModal = signal(false);
  protected showForceCancelModal = signal(false);
  protected submitting = signal(false);

  ngOnInit(): void {
    this.loadBookings();
  }

  protected loadBookings(): void {
    this.isLoading.set(true);
    const params: BookingsQueryParams = {
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
      page: this.page(),
      limit: this.limit,
      ...(this.statusFilter() && { status: this.statusFilter() }),
      ...(this.searchQuery() && { search: this.searchQuery() }),
      ...(this.dateFrom() && { dateFrom: this.dateFrom() }),
      ...(this.dateTo() && { dateTo: this.dateTo() }),
    };

    this.bookingService.getBookings(params).subscribe({
      next: (res) => {
        if (res.data) {
          this.bookings.set(res.data.data);
          this.total.set(res.data.total);
          this.totalPages.set(res.data.totalPages);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadBookings();
  }

  protected onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.page.set(1);
    this.loadBookings();
  }

  protected onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.page.set(1);
    this.loadBookings();
  }

  protected onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.page.set(1);
    this.loadBookings();
  }

  protected onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadBookings();
  }

  protected toggleDropdown(id: string, event: Event): void {
    event.stopPropagation();
    this.openDropdownId.set(this.openDropdownId() === id ? null : id);
  }

  protected closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  protected openViewDetail(booking: BookingListItem): void {
    this.selectedBooking.set(booking);
    this.showDetailModal.set(true);
    this.closeDropdown();
  }

  protected openForceCancel(booking: BookingListItem): void {
    this.selectedBooking.set(booking);
    this.showForceCancelModal.set(true);
    this.closeDropdown();
  }

  protected closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedBooking.set(null);
  }

  protected closeForceCancelModal(): void {
    this.showForceCancelModal.set(false);
    this.selectedBooking.set(null);
  }

  protected onForceCancelConfirmed(reason: string): void {
    const booking = this.selectedBooking();
    if (!booking) return;
    this.submitting.set(true);
    this.bookingService.forceCancelBooking(booking.id, reason).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeForceCancelModal();
        this.loadBookings();
      },
      error: () => this.submitting.set(false),
    });
  }

  protected getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      APPROVED: 'Confirmed',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected',
      DELETED: 'Deleted',
    };
    return labels[status] ?? status;
  }

  protected getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-50 text-yellow-700',
      APPROVED: 'bg-blue-50 text-blue-700',
      COMPLETED: 'bg-green-50 text-green-700',
      CANCELLED: 'bg-red-50 text-red-700',
      REJECTED: 'bg-gray-100 text-gray-600',
      DELETED: 'bg-gray-100 text-gray-400',
    };
    return map[status] ?? 'bg-gray-100 text-gray-500';
  }
}
