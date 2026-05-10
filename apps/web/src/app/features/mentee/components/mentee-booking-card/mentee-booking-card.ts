import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { BookingCardInterface, BookingStatus } from '@gurokonekt/models/interfaces/booking/booking.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SessionBadge } from 'apps/web/src/app/shared/components/session-badge/session-badge.component';

@Component({
  selector: 'app-mentee-booking-card',
  imports: [CommonModule, IconComponent, SessionBadge],
  templateUrl: './mentee-booking-card.html',
})
export class MenteeBookingCard {
  readonly booking = input.required<BookingCardInterface>();
  readonly viewDetails = output<BookingCardInterface>();
  readonly cancelRequest = output<BookingCardInterface>();
  readonly addReview = output<BookingCardInterface>();

  readonly BookingStatus = BookingStatus;

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

  canJoinSession(): boolean {
    const booking = this.booking();
    return booking.status === BookingStatus.APPROVED && !!booking.sessionLink;
  }

  canCancelRequest(): boolean {
    return this.booking().status === BookingStatus.PENDING;
  }

  canAddReview(): boolean {
    return this.booking().status === BookingStatus.COMPLETED;
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.booking());
  }

  onCancelRequest(): void {
    this.cancelRequest.emit(this.booking());
  }

  onAddReview(): void {
    this.addReview.emit(this.booking());
  }
}
