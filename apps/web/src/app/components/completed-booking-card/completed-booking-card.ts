import { Component, input } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';
import { StarRating } from '../shared/star-rating/star-rating';
import { SessionBadge } from '../shared/session-badge/session-badge';
import { IconComponent } from '../shared/icon/icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-completed-booking-card',
  imports: [StarRating, SessionBadge, IconComponent, CommonModule],
  templateUrl: './completed-booking-card.html',
  styleUrl: './completed-booking-card.scss',
})
export class CompletedBookingCard {

  readonly completedBooking = input.required<BookingCardInterface>();

} 