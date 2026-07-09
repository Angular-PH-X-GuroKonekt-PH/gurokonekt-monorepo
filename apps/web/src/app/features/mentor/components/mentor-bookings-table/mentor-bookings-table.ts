import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingCardInterface, BookingStatus, BookingTab } from '@gurokonekt/models/interfaces/booking/booking.model';

import { BookingsTable } from '../../../../shared/components/bookings-table/bookings-table';
import { BookingService } from '../../../../shared/services/booking.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { BookingDetailsModal } from '../../../mentor/components/mentor-bookings-table/booking-details-modal/booking-details-modal';
import { ApproveBookingModal } from '../../../mentor/components/mentor-bookings-table/approve-booking-modal/approve-booking-modal';
import { RejectBookingModal } from '../../../mentor/components/mentor-bookings-table/reject-booking-modal/reject-booking-modal';
import { UpdateBookingModal } from '../../../mentor/components/mentor-bookings-table/update-booking-modal/update-booking-modal';

@Component({
  selector: 'app-mentor-bookings-table',
  imports: [
    FormsModule,
    BookingsTable,
    BookingDetailsModal,
    ApproveBookingModal,
    RejectBookingModal,
    UpdateBookingModal,
  ],
  templateUrl: './mentor-bookings-table.html',
})
export class MentorBookingsTable {
  title = input('Recent Bookings');
  tabs = input<BookingTab[]>([
    'All',
    'Pending',
    'Approved',
    'Completed',
    'Cancelled',
    'Rejected',
  ]);
  footerMode = input<'viewAll' | 'pagination' | 'none'>('none');
  bookings = input<BookingCardInterface[] | null>(null);
  isLoading = input(false);
  maxRows = input<number | null>(null);
  currentPage = input(1);
  pageSize = input(10);
  totalItems = input(0);
  pageSizeOptions = input<number[]>([10, 20, 50]);

  pageChange = output<number>();
  pageSizeChange = output<number>();
  tabChange = output<BookingTab>();

  bookingService = inject(BookingService);
  toastService = inject(ToastService);

  activeTab = signal<BookingTab>('All');

  filteredBookings = computed(() => {
    const bookings = this.bookings() ?? [];

    if (this.footerMode() === 'pagination') {
      return bookings;
    }

    const tab = this.activeTab();

    if (tab === 'All') return bookings;

    return bookings.filter(
      (booking) => booking.status === (tab.toUpperCase() as BookingStatus)
    );
  });

  selectedBooking = signal<BookingCardInterface | null>(null);
  openActionBookingId = signal<string | null>(null);

  approvalBooking = signal<BookingCardInterface | null>(null);
  approvalSessionLink = signal('');

  rejectBookingTarget = signal<BookingCardInterface | null>(null);

  updateBookingTarget = signal<BookingCardInterface | null>(null);
  updateSessionDate = signal('');
  updateSessionTime = signal('');
  updateSessionLink = signal('');
  updateNotes = signal('');

  submitting = signal(false);

  setActiveTab(tab: string): void {
    const bookingTab = tab as BookingTab;

    if (!this.tabs().includes(bookingTab)) return;

    this.activeTab.set(bookingTab);
    this.tabChange.emit(bookingTab);
  }

  changePage(page: number): void {
    this.pageChange.emit(page);
  }

  changePageSize(pageSize: number): void {
    this.pageSizeChange.emit(pageSize);
  }

  toggleActionMenu(bookingId: string): void {
    this.openActionBookingId.update((current) =>
      current === bookingId ? null : bookingId
    );
  }

  closeActionMenu(): void {
    this.openActionBookingId.set(null);
  }

  viewDetails(booking: BookingCardInterface): void {
    this.closeActionMenu();
    this.selectedBooking.set(booking);
  }

  closeDetails(): void {
    this.selectedBooking.set(null);
  }

  approveBooking(booking: BookingCardInterface): void {
    this.closeActionMenu();
    this.approvalBooking.set(booking);
    this.approvalSessionLink.set('');
  }

  closeApprovalModal(): void {
    this.approvalBooking.set(null);
    this.approvalSessionLink.set('');
  }

  confirmApproval(): void {
    const booking = this.approvalBooking();
    const sessionLink = this.approvalSessionLink().trim();

    if (!booking) return;

    if (!sessionLink) {
      this.toastService.warning('Session link is required.');
      return;
    }

    this.submitting.set(true);

    this.bookingService.approveBooking(booking.id, sessionLink).subscribe({
      next: (updatedBooking) => {
        this.submitting.set(false);

        if (!updatedBooking) {
          this.toastService.error('Failed to approve booking.');
          return;
        }

        this.toastService.success('Booking approved successfully.');
        this.closeApprovalModal();
        setTimeout(() => window.location.reload(), 800);
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.error('Failed to approve booking.');
      },
    });
  }

  rejectBooking(booking: BookingCardInterface): void {
    this.closeActionMenu();
    this.rejectBookingTarget.set(booking);
  }

  closeRejectModal(): void {
    this.rejectBookingTarget.set(null);
  }

  confirmRejectBooking(): void {
    const booking = this.rejectBookingTarget();

    if (!booking) return;

    this.submitting.set(true);

    this.bookingService.rejectBooking(booking.id).subscribe({
      next: (updatedBooking) => {
        this.submitting.set(false);

        if (!updatedBooking) {
          this.toastService.error('Failed to reject booking.');
          return;
        }

        this.toastService.success('Booking rejected successfully.');
        this.closeRejectModal();
        setTimeout(() => window.location.reload(), 800);
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.error('Failed to reject booking.');
      },
    });
  }

  markAsCompleted(booking: BookingCardInterface): void {
    this.closeActionMenu();

    if (!this.canMarkAsCompleted(booking)) {
      this.toastService.warning(
        'This session can only be marked completed after its scheduled time.'
      );
      return;
    }

    this.submitting.set(true);

    this.bookingService.completeBooking(booking.id).subscribe({
      next: (updatedBooking) => {
        this.submitting.set(false);

        if (!updatedBooking) {
          this.toastService.error('Failed to mark session as completed.');
          return;
        }

        this.toastService.success('Session marked as completed.');
        setTimeout(() => window.location.reload(), 800);
      },
      error: () => {
        this.submitting.set(false);
        this.toastService.error('Failed to mark session as completed.');
      },
    });
  }

  canMarkAsCompleted(booking: BookingCardInterface): boolean {
    return (
      booking.status === BookingStatus.APPROVED &&
      new Date(booking.sessionDateTime) <= new Date()
    );
  }

  updateBooking(booking: BookingCardInterface): void {
    this.closeActionMenu();

    const date = new Date(booking.sessionDateTime);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const localValue = localDate.toISOString();

    this.updateBookingTarget.set(booking);
    this.updateSessionDate.set(localValue.slice(0, 10));
    this.updateSessionTime.set(localValue.slice(11, 16));
    this.updateSessionLink.set(booking.sessionLink ?? '');
    this.updateNotes.set(booking.notes ?? '');
  }

  closeUpdateModal(): void {
    this.updateBookingTarget.set(null);
    this.updateSessionDate.set('');
    this.updateSessionTime.set('');
    this.updateSessionLink.set('');
    this.updateNotes.set('');
  }

  confirmUpdateBooking(): void {
    const booking = this.updateBookingTarget();

    if (!booking) return;

    if (!this.updateSessionDate() || !this.updateSessionTime()) {
      this.toastService.warning('Session date and time are required.');
      return;
    }

    const sessionDateTime = new Date(
      `${this.updateSessionDate()}T${this.updateSessionTime()}`
    );

    this.submitting.set(true);

    this.bookingService
      .updateBooking(booking.id, {
        sessionDateTime: sessionDateTime.toISOString(),
        notes: this.updateNotes().trim() || undefined,
        sessionLink: this.updateSessionLink().trim() || undefined,
      })
      .subscribe({
        next: (updatedBooking) => {
          this.submitting.set(false);

          if (!updatedBooking) {
            this.toastService.error('Failed to update booking.');
            return;
          }

          this.toastService.success('Booking updated successfully.');
          this.closeUpdateModal();
          setTimeout(() => window.location.reload(), 800);
        },
        error: () => {
          this.submitting.set(false);
          this.toastService.error('Failed to update booking.');
        },
      });
  }
}
