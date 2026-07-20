import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-mentee-booking-details-modal',
  imports: [DatePipe],
  templateUrl: './mentee-booking-details-modal.html',
})
export class MenteeBookingDetailsModal {
  booking = input.required<BookingCardInterface>();
  closed = output<void>();
}
