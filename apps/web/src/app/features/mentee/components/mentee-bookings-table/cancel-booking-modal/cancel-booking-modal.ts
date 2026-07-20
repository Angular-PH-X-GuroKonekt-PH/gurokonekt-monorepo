import { Component, input, output } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-cancel-booking-modal',
  templateUrl: './cancel-booking-modal.html',
})
export class CancelBookingModal {
  booking = input.required<BookingCardInterface>();
  submitting = input(false);
  closed = output<void>();
  confirmed = output<void>();
}
