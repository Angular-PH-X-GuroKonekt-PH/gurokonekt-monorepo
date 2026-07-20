import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  BookingCardInterface,
  BookingStatus,
  BookingTab,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { BookingsTable } from '../../../../shared/components/bookings-table/bookings-table';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BookingService } from '../../../../shared/services/booking.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CancelBookingModal } from './cancel-booking-modal/cancel-booking-modal';
import { MenteeBookingDetailsModal } from './mentee-booking-details-modal/mentee-booking-details-modal';

@Component({
  selector: 'app-mentee-bookings-table',
  imports: [BookingsTable, CancelBookingModal, IconComponent, MenteeBookingDetailsModal],
  templateUrl: './mentee-bookings-table.html',
})
export class MenteeBookingsTable {
  private readonly bookingService = inject(BookingService);
  private readonly toastService = inject(ToastService);

  title = input('Booking Overview');
  tabs = input<BookingTab[]>([
    'All',
    'Pending',
    'Approved',
    'Completed',
    'Cancelled',
    'Rejected',
  ]);
  bookings = input<BookingCardInterface[] | null>(null);
  isLoading = input(false);
  initialTab = input<BookingTab>('All');
  initialBookingId = input<string | null>(null);

  bookingUpdated = output<void>();

  protected readonly activeTab = signal<BookingTab>('All');
  protected readonly selectedBooking = signal<BookingCardInterface | null>(null);
  protected readonly cancelBookingTarget = signal<BookingCardInterface | null>(null);
  protected readonly openActionBookingId = signal<string | null>(null);
  protected readonly submitting = signal(false);
  private readonly openedBookingId = signal<string | null>(null);

  protected readonly filteredBookings = computed(() => {
    const bookings = this.bookings() ?? [];
    const activeTab = this.activeTab();

    if (activeTab === 'All') return bookings;

    return bookings.filter(
      (booking) => booking.status === (activeTab.toUpperCase() as BookingStatus)
    );
  });

  constructor() {
    effect(() => {
      const initialTab = this.initialTab();
      if (this.tabs().includes(initialTab)) this.activeTab.set(initialTab);
    });

    effect(() => {
      const bookingId = this.initialBookingId();
      if (!bookingId || this.openedBookingId() === bookingId) return;

      const booking = (this.bookings() ?? []).find(
        (item) => item.id === bookingId
      );

      if (booking) {
        this.selectedBooking.set(booking);
        this.openedBookingId.set(bookingId);
      }
    });
  }

  protected setActiveTab(tab: string): void {
    const bookingTab = tab as BookingTab;
    if (this.tabs().includes(bookingTab)) this.activeTab.set(bookingTab);
  }

  protected toggleActionMenu(bookingId: string): void {
    this.openActionBookingId.update((current) =>
      current === bookingId ? null : bookingId
    );
  }

  protected closeActionMenu(): void {
    this.openActionBookingId.set(null);
  }

  protected viewDetails(booking: BookingCardInterface): void {
    this.closeActionMenu();
    this.selectedBooking.set(booking);
  }

  protected closeDetails(): void {
    this.selectedBooking.set(null);
  }

  protected canCancelRequest(booking: BookingCardInterface): boolean {
    return booking.status === BookingStatus.PENDING;
  }

  protected cancelRequest(booking: BookingCardInterface): void {
    this.closeActionMenu();
    this.cancelBookingTarget.set(booking);
  }

  protected closeCancelModal(): void {
    this.cancelBookingTarget.set(null);
  }

  protected confirmCancellation(): void {
    const booking = this.cancelBookingTarget();
    if (!booking || this.submitting()) return;

    this.submitting.set(true);
    this.bookingService
      .updateBooking(booking.id, { status: BookingStatus.CANCELLED })
      .subscribe({
        next: (updatedBooking) => {
          this.submitting.set(false);

          if (!updatedBooking) {
            this.toastService.error('Unable to cancel the booking request.');
            return;
          }

          this.toastService.success('Booking request cancelled successfully.');
          this.closeCancelModal();
          this.bookingUpdated.emit();
        },
        error: () => {
          this.submitting.set(false);
          this.toastService.error('Unable to cancel the booking request.');
        },
      });
  }

  protected canJoinSession(booking: BookingCardInterface): boolean {
    return booking.status === BookingStatus.APPROVED && !!booking.sessionLink;
  }

  protected canAddReview(booking: BookingCardInterface): boolean {
    return booking.status === BookingStatus.COMPLETED;
  }

  protected addReview(): void {
    this.closeActionMenu();
    this.toastService.info(
      'Review submission is not available yet.',
      'Add Review'
    );
  }
}
