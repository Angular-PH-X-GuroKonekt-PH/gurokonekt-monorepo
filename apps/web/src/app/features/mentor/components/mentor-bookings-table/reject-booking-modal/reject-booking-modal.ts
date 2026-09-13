import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';
import {
  formatTimeInputInTimezone,
  getDateKeyInTimezone,
} from '@gurokonekt/utils';

@Component({
  selector: 'app-reject-booking-modal',
  imports: [FormsModule],
  templateUrl: './reject-booking-modal.html',
})
export class RejectBookingModal {
  booking = input.required<BookingCardInterface>();
  submitting = input(false);
  displayTimezone = input('UTC');
  mentorNotes = model('');

  closed = output<void>();
  confirmed = output<void>();

  protected bookingDate(): string {
    return getDateKeyInTimezone(
      new Date(this.booking().sessionDateTime),
      this.displayTimezone(),
    );
  }

  protected bookingTime(): string {
    return formatTimeInputInTimezone(
      this.booking().sessionDateTime,
      this.displayTimezone(),
    );
  }
}
