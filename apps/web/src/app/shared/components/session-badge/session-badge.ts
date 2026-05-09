import { Component, input } from '@angular/core';
import { BookingStatus } from '@gurokonekt/models/interfaces/booking/booking.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-session-badge',
  imports: [IconComponent],
  templateUrl: './session-badge.html',
  styleUrl: './session-badge.scss',
})
export class SessionBadge {

   BookingStatus = BookingStatus;

  status = input.required<BookingStatus>();

}
