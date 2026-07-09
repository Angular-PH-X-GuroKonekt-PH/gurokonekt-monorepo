import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { MentorBookingsTable } from '../../components/mentor-bookings-table/mentor-bookings-table';
import { MentorBookingService } from '../../services/mentor-booking.service';
import { Store } from '@ngxs/store';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';
import { BookingTab } from '@gurokonekt/models/interfaces/booking/booking.model';
@Component({
  selector: 'app-mentor-dashboard-page',
  imports: [DatePipe, MentorBookingsTable],
  templateUrl: './mentor-dashboard.page.html',
})
export class MentorDashboardPage {
  store = inject(Store);
  authUser = this.store.selectSignal(AuthSelectors.user);
  mentorBookings = inject(MentorBookingService);
  readonly bookingTabs: BookingTab[] = [
    'All',
    'Pending',
    'Approved',
    'Completed',
  ];

  fullName = computed(() => {
    const value = this.authUser()?.['fullName'];
    return typeof value === 'string' && value.trim() ? value : 'Mentee';
  });
}
