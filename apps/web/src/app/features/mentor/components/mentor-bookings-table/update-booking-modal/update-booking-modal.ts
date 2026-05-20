import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-update-booking-modal',
  imports: [FormsModule],
  templateUrl: './update-booking-modal.html',
})
export class UpdateBookingModal {
  booking = input.required<BookingCardInterface>();
  submitting = input(false);

  sessionDate = model('');
  sessionTime = model('');
  sessionLink = model('');
  notes = model('');

  closed = output<void>();
  confirmed = output<void>();  
}
