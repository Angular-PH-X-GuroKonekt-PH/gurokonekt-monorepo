import { Component, input } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';
import { formatDateInTimezone } from '@gurokonekt/utils';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SessionBadge } from '../../../../shared/components/session-badge/session-badge.component';
import { StarRating } from '../../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-mentee-completed-booking-card',
  imports: [StarRating, SessionBadge, IconComponent, CommonModule],
  templateUrl: './mentee-completed-booking-card.html',
})
export class MenteeCompletedBookingCard {

  readonly completedBooking = input.required<BookingCardInterface>();
  readonly displayTimezone = input('UTC');

  protected formatBookingDate(date: Date | string): string {
    return formatDateInTimezone(date, this.displayTimezone());
  }

}
