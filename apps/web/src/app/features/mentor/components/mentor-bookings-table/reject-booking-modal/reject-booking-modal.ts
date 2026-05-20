import { Component, input, output } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-reject-booking-modal',
  imports: [],
  templateUrl: './reject-booking-modal.html',
})
export class RejectBookingModal {
  booking = input.required<BookingCardInterface>();
  submitting = input(false);

  closed = output<void>();
  confirmed = output<void>();  
}
