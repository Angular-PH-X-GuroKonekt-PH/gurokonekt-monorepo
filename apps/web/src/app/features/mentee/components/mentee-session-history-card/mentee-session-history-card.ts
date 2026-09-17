import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { BookingSessionCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';
import { formatDateInTimezone, formatTimeInTimezone } from '@gurokonekt/utils';
import { StarRating } from '../../../../shared/components/star-rating/star-rating.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SessionBadge } from '../../../../shared/components/session-badge/session-badge.component';


@Component({
  selector: 'app-mentee-session-history-card',
  imports: [CommonModule, StarRating, IconComponent, SessionBadge],
  templateUrl: './mentee-session-history-card.html',
})
export class MenteeSessionHistoryCard {

  completedSessions = input.required<BookingSessionCardInterface[]>()
  displayTimezone = input('UTC');

  protected formatBookingDate(date: Date | string): string {
    return formatDateInTimezone(date, this.displayTimezone());
  }

  protected formatBookingTime(date: Date | string): string {
    return formatTimeInTimezone(date, this.displayTimezone());
  }

}
