import { Component, inject, OnDestroy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { MentorBookingService } from '../../services/mentor-booking.service';
import { MentorBookingsTable } from '../../components/mentor-bookings-table/mentor-bookings-table';
import { SectionTitle } from '../../../../../../../web/src/app/shared/components/section-title/section-title.component';
import { BookingTab } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-mentor-booking-overview-page',
  imports: [MentorBookingsTable, SectionTitle],
  templateUrl: './mentor-booking-overview.page.html',
  styleUrl: './mentor-booking-overview.page.scss',
})
export class MentorBookingOverviewPage implements OnDestroy {
  mentorBookings = inject(MentorBookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly initialBookingId = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('bookingId'))),
    { initialValue: this.route.snapshot.queryParamMap.get('bookingId') },
  );
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

  protected closeLinkedBooking(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { bookingId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
