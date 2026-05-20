import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-approve-booking-modal',
  imports: [FormsModule],
  templateUrl: './approve-booking-modal.html',
})
export class ApproveBookingModal {
  booking = input.required<BookingCardInterface>();
  submitting = input(false);
  sessionLink = model('');

  closed = output<void>();
  confirmed = output<void>();
}
