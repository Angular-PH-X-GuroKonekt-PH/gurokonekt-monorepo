import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SessionBadge } from '../../../../shared/components/session-badge/session-badge.component';

export type MenteeBookingWidgetMode = 'upcoming' | 'history';

@Component({
  selector: 'app-mentee-dashboard-booking-widget',
  imports: [DatePipe, IconComponent, SessionBadge],
  templateUrl: './mentee-dashboard-booking-widget.html',
})
export class MenteeDashboardBookingWidget {
  mode = input.required<MenteeBookingWidgetMode>();
  bookings = input.required<BookingCardInterface[]>();
  totalCount = input(0);
  loading = input(false);

  viewDetails = output<BookingCardInterface>();
  viewAll = output<void>();

  protected readonly title = computed(() =>
    this.mode() === 'upcoming' ? 'Upcoming Sessions' : 'Session History'
  );

  protected readonly subtitle = computed(() =>
    this.mode() === 'upcoming'
      ? 'Your next mentoring sessions at a glance.'
      : 'Your 5 most recently completed sessions.'
  );

  protected readonly emptyTitle = computed(() =>
    this.mode() === 'upcoming'
      ? 'No upcoming sessions'
      : 'No completed sessions yet'
  );

  protected readonly emptyMessage = computed(() =>
    this.mode() === 'upcoming'
      ? 'New booking requests and confirmed sessions will appear here.'
      : 'Completed mentoring sessions will appear here.'
  );
}
