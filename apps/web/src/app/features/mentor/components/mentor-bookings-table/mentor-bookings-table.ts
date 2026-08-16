import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BookingCardInterface,
  BookingStatus,
  BookingTab,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { BookingsTable } from '../../../../shared/components/bookings-table/bookings-table';
import { BookingService } from '../../../../shared/services/booking.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { BookingDetailsModal } from '../../../mentor/components/mentor-bookings-table/booking-details-modal/booking-details-modal';
import { ApproveBookingModal } from '../../../mentor/components/mentor-bookings-table/approve-booking-modal/approve-booking-modal';
import { MentorCancelBookingModal } from '../../../mentor/components/mentor-bookings-table/cancel-booking-modal/cancel-booking-modal';
import { RejectBookingModal } from '../../../mentor/components/mentor-bookings-table/reject-booking-modal/reject-booking-modal';
import { UpdateBookingModal } from '../../../mentor/components/mentor-bookings-table/update-booking-modal/update-booking-modal';

@Component({
  selector: 'app-mentor-bookings-table',
  imports: [
    FormsModule,
    BookingsTable,
    BookingDetailsModal,
    ApproveBookingModal,
    MentorCancelBookingModal,
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
      (booking) => booking.status === (tab.toUpperCase() as BookingStatus),
    );
  });

  selectedBooking = signal<BookingCardInterface | null>(null);
  openActionBookingId = signal<string | null>(null);

  approvalBooking = signal<BookingCardInterface | null>(null);
  approvalSessionDate = signal('');
  approvalSessionTime = signal('');
  approvalSessionLink = signal('');
  approvalMentorNotes = signal('');

  rejectBookingTarget = signal<BookingCardInterface | null>(null);
  rejectMentorNotes = signal('');

  cancelBookingTarget = signal<BookingCardInterface | null>(null);
  cancelMentorNotes = signal('');

  updateBookingTarget = signal<BookingCardInterface | null>(null);
  updateSessionDate = signal('');
  updateSessionTime = signal('');
  updateSessionLink = signal('');
  updateMentorNotes = signal('');

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
      current === bookingId ? null : bookingId,
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

    const utcValue = new Date(booking.sessionDateTime).toISOString();

    this.approvalBooking.set(booking);
    this.approvalSessionDate.set(utcValue.slice(0, 10));
    this.approvalSessionTime.set(utcValue.slice(11, 16));
    this.approvalSessionLink.set(booking.sessionLink ?? '');
    this.approvalMentorNotes.set(booking.mentorNotes ?? '');
  }

  closeApprovalModal(): void {
    this.approvalBooking.set(null);
    this.approvalSessionDate.set('');
    this.approvalSessionTime.set('');
    this.approvalSessionLink.set('');
    this.approvalMentorNotes.set('');
  }

  confirmApproval(): void {
    const booking = this.approvalBooking();
    const sessionLink = this.approvalSessionLink().trim();

    if (!booking) return;

    if (!this.approvalSessionDate() || !this.approvalSessionTime()) {
      this.toastService.warning('Session date and time are required.');
      return;
    }

    if (!sessionLink) {
      this.toastService.warning('Session link is required.');
      return;
    }

    this.submitting.set(true);

    const sessionDateTime = new Date(
      `${this.approvalSessionDate()}T${this.approvalSessionTime()}:00.000Z`,
    );

    this.bookingService
      .approveBooking(booking.id, {
        sessionDateTime: sessionDateTime.toISOString(),
        sessionLink,
        mentorNotes: this.approvalMentorNotes().trim(),
      })
      .subscribe({
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
    this.rejectMentorNotes.set(booking.mentorNotes ?? '');
  }

  closeRejectModal(): void {
    this.rejectBookingTarget.set(null);
    this.rejectMentorNotes.set('');
  }

  confirmRejectBooking(): void {
    const booking = this.rejectBookingTarget();

    if (!booking) return;

    this.submitting.set(true);

    this.bookingService
      .rejectBooking(booking.id, {
        mentorNotes: this.rejectMentorNotes().trim(),
      })
      .subscribe({
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

  cancelBooking(booking: BookingCardInterface): void {
    this.closeActionMenu();
    this.cancelBookingTarget.set(booking);
    this.cancelMentorNotes.set(booking.mentorNotes ?? '');
  }

  closeCancelModal(): void {
    this.cancelBookingTarget.set(null);
    this.cancelMentorNotes.set('');
  }

  confirmCancelBooking(): void {
    const booking = this.cancelBookingTarget();

    if (!booking) return;

    this.submitting.set(true);

    this.bookingService
      .cancelBooking(booking.id, {
        mentorNotes: this.cancelMentorNotes().trim(),
      })
      .subscribe({
        next: (updatedBooking) => {
          this.submitting.set(false);

          if (!updatedBooking) {
            this.toastService.error('Failed to cancel session.');
            return;
          }

          this.toastService.success('Session cancelled successfully.');
          this.closeCancelModal();
          setTimeout(() => window.location.reload(), 800);
        },
        error: () => {
          this.submitting.set(false);
          this.toastService.error('Failed to cancel session.');
        },
      });
  }

  markAsCompleted(booking: BookingCardInterface): void {
    this.closeActionMenu();

    if (!this.canMarkAsCompleted(booking)) {
      this.toastService.warning(
        'This session can only be marked completed after its scheduled time.',
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

    const utcValue = new Date(booking.sessionDateTime).toISOString();

    this.updateBookingTarget.set(booking);
    this.updateSessionDate.set(utcValue.slice(0, 10));
    this.updateSessionTime.set(utcValue.slice(11, 16));
    this.updateSessionLink.set(booking.sessionLink ?? '');
    this.updateMentorNotes.set(booking.mentorNotes ?? '');
  }

  closeUpdateModal(): void {
    this.updateBookingTarget.set(null);
    this.updateSessionDate.set('');
    this.updateSessionTime.set('');
    this.updateSessionLink.set('');
    this.updateMentorNotes.set('');
  }

  confirmUpdateBooking(): void {
    const booking = this.updateBookingTarget();

    if (!booking) return;

    if (!this.updateSessionDate() || !this.updateSessionTime()) {
      this.toastService.warning('Session date and time are required.');
      return;
    }

    const sessionDateTime = new Date(
      `${this.updateSessionDate()}T${this.updateSessionTime()}:00.000Z`,
    );

    this.submitting.set(true);

    this.bookingService
      .updateBooking(booking.id, {
        sessionDateTime: sessionDateTime.toISOString(),
        mentorNotes: this.updateMentorNotes().trim(),
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
