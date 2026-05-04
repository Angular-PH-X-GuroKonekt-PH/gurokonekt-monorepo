import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';
import { IconComponent } from '../icon/icon.component';


@Component({
  selector: 'app-featured-booking-card',
  imports: [CommonModule, IconComponent],
  templateUrl: './featured-booking-card.html',
  styleUrl: './featured-booking-card.scss',
})
export class FeaturedBookingCard {
  readonly booking = input<BookingCardInterface | null>(null);
  readonly viewDetails = output<BookingCardInterface>();

  protected getBookingTitle(booking: BookingCardInterface): string {
    if (booking.notes?.trim()) {
      return booking.notes.trim();
    }

    return 'Upcoming mentoring session';
  }

  protected getBookingDateTime(booking: BookingCardInterface): string {
    const sessionDate = new Date(booking.sessionDateTime);

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(sessionDate);
  }

  protected onViewDetails(booking: BookingCardInterface): void {
    this.viewDetails.emit(booking);
  }
}
