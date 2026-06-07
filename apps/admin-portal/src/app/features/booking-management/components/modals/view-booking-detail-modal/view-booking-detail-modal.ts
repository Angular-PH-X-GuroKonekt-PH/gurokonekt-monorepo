import { Component, input, output, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BookingManagementService, BookingListItem, BookingDetail } from '../../../services/booking-management.service';

@Component({
  selector: 'app-view-booking-detail-modal',
  imports: [DatePipe],
  templateUrl: './view-booking-detail-modal.html',
})
export class ViewBookingDetailModalComponent {
  private readonly bookingService = inject(BookingManagementService);

  readonly booking = input.required<BookingListItem>();
  readonly closed = output<void>();

  protected detail = signal<BookingDetail | null>(null);
  protected isLoading = signal(true);

  constructor() {
    effect(() => {
      const b = this.booking();
      if (!b) return;
      this.isLoading.set(true);
      this.detail.set(null);

      this.bookingService.getBookingById(b.id).subscribe({
        next: (res) => {
          this.detail.set(res.data ?? null);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    });
  }

  protected close(): void {
    this.closed.emit();
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
