import { DatePipe } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-mentor-cancel-booking-modal',
  imports: [DatePipe, FormsModule],
  templateUrl: './cancel-booking-modal.html',
})
export class MentorCancelBookingModal {
  booking = input.required<BookingCardInterface>();
  submitting = input(false);
  mentorNotes = model('');

  closed = output<void>();
  confirmed = output<void>();
}
