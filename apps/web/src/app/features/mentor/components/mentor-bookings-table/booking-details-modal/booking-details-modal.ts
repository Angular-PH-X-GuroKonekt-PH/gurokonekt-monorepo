import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-booking-details-modal',
  imports: [DatePipe],
  templateUrl: './booking-details-modal.html',
})
export class BookingDetailsModal {
  booking = input.required<BookingCardInterface>();
  closed = output<void>();  
}
