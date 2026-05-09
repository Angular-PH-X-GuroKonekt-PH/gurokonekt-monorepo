import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { IconComponent, IconName } from '../../../../shared/components/icon/icon.component';
import { SessionBadge } from 'apps/web/src/app/shared/components/session-badge/session-badge';

@Component({
  selector: 'app-session-booking-card',
  imports: [IconComponent, CommonModule, SessionBadge],
  templateUrl: './session-booking-card.html',
  styleUrl: './session-booking-card.scss',
})
export class SessionBookingCard {
  bookingList = input<BookingCardInterface[]>([]);
  emptyIcon = input<IconName>('calendar-days');
  emptyTitle = input('No bookings yet');
  emptyMessage = input(
    'You do not have any bookings at the moment. Once you schedule a mentoring session, it will appear here for easy tracking and follow-up.'
  );
  viewDetails = output<BookingCardInterface>();
  cancelRequest = output<BookingCardInterface>();
  addReview = output<BookingCardInterface>();

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

  canJoinSession(booking: BookingCardInterface): boolean {
    return booking.status === BookingStatus.APPROVED && !!booking.sessionLink;
  }

  canCancelRequest(booking: BookingCardInterface): boolean {
    return booking.status === BookingStatus.PENDING;
  }

  canAddReview(booking: BookingCardInterface): boolean {
    return booking.status === BookingStatus.COMPLETED;
  }

  onViewDetails(booking: BookingCardInterface): void {
    this.viewDetails.emit(booking);
  }

  onCancelRequest(booking: BookingCardInterface): void {
    this.cancelRequest.emit(booking);
  }

  onAddReview(booking: BookingCardInterface): void {
    this.addReview.emit(booking);
  }
}
