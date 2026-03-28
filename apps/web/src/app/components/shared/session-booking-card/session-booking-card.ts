import { Component, input } from '@angular/core';
import { IconComponent } from "../icon/icon.component";
import { BookingSessionCardInterface, BookingStatus } from '@gurokonekt/models/interfaces/booking/booking.model';
import { CommonModule } from '@angular/common';
import { SessionBadge } from '../session-badge/session-badge';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-session-booking-card',
  imports: [IconComponent, CommonModule, SessionBadge, RouterLink],
  templateUrl: './session-booking-card.html',
  styleUrl: './session-booking-card.scss',
})
export class SessionBookingCard {

  bookingList = input<BookingSessionCardInterface[]>([]);

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
}
