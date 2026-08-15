import { DatePipe } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-reject-booking-modal',
  imports: [DatePipe, FormsModule],
  templateUrl: './reject-booking-modal.html',
})
export class RejectBookingModal {
  booking = input.required<BookingCardInterface>();
  submitting = input(false);
  mentorNotes = model('');

  closed = output<void>();
  confirmed = output<void>();  
}
