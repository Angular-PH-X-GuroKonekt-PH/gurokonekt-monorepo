import { Component, input } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';
import { CommonModule } from '@angular/common';
import { IconComponent } from 'apps/web/src/app/shared/components/icon/icon.component';
import { SessionBadge } from 'apps/web/src/app/shared/components/session-badge/session-badge';
import { StarRating } from 'apps/web/src/app/shared/components/star-rating/star-rating';

@Component({
  selector: 'app-mentee-completed-booking-card',
  imports: [StarRating, SessionBadge, IconComponent, CommonModule],
  templateUrl: './mentee-completed-booking-card.html',
})
export class MenteeCompletedBookingCard {

  readonly completedBooking = input.required<BookingCardInterface>();

} 