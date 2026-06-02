import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BookingManagementService, BookingListItem, BookingsQueryParams } from '../../services/booking-management.service';

@Component({
  selector: 'app-booking-table',
  imports: [DatePipe],
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
  protected sortBy = signal<'sessionDateTime' | 'createdAt'>('createdAt');
  protected sortOrder = signal<'asc' | 'desc'>('desc');
  protected page = signal(1);
  protected readonly limit = 20;

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

  protected onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadBookings();
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
