import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import {
  BookingSessionCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { IconComponent, IconName } from '../icon/icon.component';
import { SessionBadge } from '../session-badge/session-badge';

@Component({
  selector: 'app-session-booking-card',
  imports: [IconComponent, CommonModule, SessionBadge],
  templateUrl: './session-booking-card.html',
  styleUrl: './session-booking-card.scss',
})
export class SessionBookingCard {
  bookingList = input<BookingSessionCardInterface[]>([]);
  emptyIcon = input<IconName>('calendar-days');
  emptyTitle = input('No bookings yet');
  emptyMessage = input(
    'You do not have any bookings at the moment. Once you schedule a mentoring session, it will appear here for easy tracking and follow-up.'
  );
  viewDetails = output<BookingSessionCardInterface>();
  cancelRequest = output<BookingSessionCardInterface>();
  addReview = output<BookingSessionCardInterface>();

  BookingStatus = BookingStatus;

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.APPROVED:
        return 'Upcoming';
      case BookingStatus.PENDING:
        return 'Pending';
      case BookingStatus.CANCELLED:
        return 'Cancelled';
      case BookingStatus.REJECTED:
        return 'Rejected';
      case BookingStatus.COMPLETED:
        return 'Completed';
      default:
        return status;
    }
  }

  canJoinSession(booking: BookingSessionCardInterface): boolean {
    return booking.status === BookingStatus.APPROVED && !!booking.sessionLink;
  }

  canCancelRequest(booking: BookingSessionCardInterface): boolean {
    return booking.status === BookingStatus.PENDING;
  }

  canAddReview(booking: BookingSessionCardInterface): boolean {
    return booking.status === BookingStatus.COMPLETED;
  }

  onViewDetails(booking: BookingSessionCardInterface): void {
    this.viewDetails.emit(booking);
  }

  onCancelRequest(booking: BookingSessionCardInterface): void {
    this.cancelRequest.emit(booking);
  }

  onAddReview(booking: BookingSessionCardInterface): void {
    this.addReview.emit(booking);
  }
}
