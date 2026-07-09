import { Component, inject, OnDestroy } from '@angular/core';
import { MentorBookingService } from '../../services/mentor-booking.service';
import { MentorBookingsTable } from "../../components/mentor-bookings-table/mentor-bookings-table";
import { SectionTitle } from "../../../../../../../web/src/app/shared/components/section-title/section-title.component";
import { BookingTab } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-mentor-booking-overview-page',
  imports: [MentorBookingsTable, SectionTitle],
  templateUrl: './mentor-booking-overview.page.html',
  styleUrl: './mentor-booking-overview.page.scss',
})
export class MentorBookingOverviewPage implements OnDestroy {
  mentorBookings = inject(MentorBookingService);
  readonly bookingTabs: BookingTab[] = [
    'All',
    'Pending',
    'Approved',
    'Completed',
    'Cancelled',
    'Rejected',
  ];

  ngOnDestroy(): void {
    this.mentorBookings.resetPagination();
  }
}
