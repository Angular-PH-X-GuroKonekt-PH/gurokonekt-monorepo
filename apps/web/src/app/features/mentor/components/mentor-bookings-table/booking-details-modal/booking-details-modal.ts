import { Component, HostListener, input, output } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';
import { formatDateInTimezone, formatTimeInTimezone } from '@gurokonekt/utils';

@Component({
  selector: 'app-booking-details-modal',
  templateUrl: './booking-details-modal.html',
})
export class BookingDetailsModal {
  booking = input.required<BookingCardInterface>();
  displayTimezone = input('UTC');
  closed = output<void>();

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.closed.emit();
  }

  protected formatBookingDate(date: Date | string): string {
    return formatDateInTimezone(date, this.displayTimezone());
  }

  protected formatBookingTime(date: Date | string): string {
    return formatTimeInTimezone(date, this.displayTimezone());
  }
}
