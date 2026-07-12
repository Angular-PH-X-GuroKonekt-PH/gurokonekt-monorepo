import { Component, input, output, signal } from '@angular/core';
import {
  DaysInWeek,
  TimeFrameAvailabilityStatus,
  TimeFrameInterface,
  UserAvailabilityInterface,
} from '@gurokonekt/models/interfaces/user/user.model';
import {
  ActiveBookingSummaryInterface,
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { WeekPicker } from '../../../../shared/components/week-picker/week-picker';
import {
  formatBookingTime,
  formatDateLabel,
  formatTimeRange,
  getActiveBookingForFrame,
  getActiveBookingSummariesForDay,
  getAvailableSlotCount,
  getBookingBadgeClasses,
  getBookingSummaryLabel,
  getDateForDay,
  getTimeFrameStatus,
} from '../../pages/mentor-manage-availability-page/availability.helpers';

export interface AvailabilityTimeFrameAction {
  slot: UserAvailabilityInterface;
  timeFrame: TimeFrameInterface;
  timeFrameIndex: number;
}

@Component({
  selector: 'app-availability-table',
  imports: [IconComponent, WeekPicker],
  templateUrl: './availability-table.html',
})
export class AvailabilityTable {
  title = input('Weekly Availability');
  availabilities = input<UserAvailabilityInterface[]>([]);
  blockedBookings = input<BookingCardInterface[]>([]);
  sessionDurationMinutes = input(60);
  selectedWeekValue = input.required<string>();
  showWeekPicker = input(true);
  showBookingDetails = input(true);

  selectedWeekChange = output<string>();
  editDay = output<UserAvailabilityInterface>();
  deleteDay = output<UserAvailabilityInterface>();
  editTimeFrame = output<AvailabilityTimeFrameAction>();
  deleteTimeFrame = output<AvailabilityTimeFrameAction>();

  readonly days = [
    DaysInWeek.Monday,
    DaysInWeek.Tuesday,
    DaysInWeek.Wednesday,
    DaysInWeek.Thursday,
    DaysInWeek.Friday,
    DaysInWeek.Saturday,
    DaysInWeek.Sunday,
  ];

  private readonly expandedDays = signal<DaysInWeek[]>([]);

  formatTimeRange = formatTimeRange;

  isDayExpanded(day: DaysInWeek): boolean {
    return this.expandedDays().includes(day);
  }

  toggleDayDetails(day: DaysInWeek): void {
    this.expandedDays.update((expandedDays) =>
      expandedDays.includes(day)
        ? expandedDays.filter((expandedDay) => expandedDay !== day)
        : [...expandedDays, day]
    );
  }

  getAvailabilityForDay(day: DaysInWeek): UserAvailabilityInterface | null {
    return this.availabilities().find((slot) => slot.day === day) ?? null;
  }

  getDateForDay(day: DaysInWeek): Date {
    return getDateForDay(day, this.days, this.selectedWeekValue());
  }

  getDateLabelForDay(day: DaysInWeek): string {
    return formatDateLabel(this.getDateForDay(day));
  }

  getAvailableSlotCount(day: DaysInWeek): number {
    return getAvailableSlotCount(
      this.getAvailabilityForDay(day),
      this.getDateForDay(day),
      this.blockedBookings(),
      this.sessionDurationMinutes()
    );
  }

  getBookingSummaryLabel(day: DaysInWeek): string {
    const bookings: ActiveBookingSummaryInterface[] =
      getActiveBookingSummariesForDay(
        this.getAvailabilityForDay(day),
        this.getDateForDay(day),
        this.blockedBookings(),
        this.sessionDurationMinutes()
      );

    return getBookingSummaryLabel(bookings);
  }

  getActiveBookingForFrame(
    day: DaysInWeek,
    frame: TimeFrameInterface
  ): BookingCardInterface | null {
    return getActiveBookingForFrame(
      frame,
      this.getDateForDay(day),
      this.blockedBookings(),
      this.sessionDurationMinutes()
    );
  }

  getBlockedTimeForFrame(
    day: DaysInWeek,
    frame: TimeFrameInterface
  ): string | null {
    const booking = this.getActiveBookingForFrame(day, frame);
    return booking
      ? formatBookingTime(booking, this.sessionDurationMinutes())
      : null;
  }

  getTimeFrameStatus(
    day: DaysInWeek,
    frame: TimeFrameInterface
  ): TimeFrameAvailabilityStatus {
    return getTimeFrameStatus(this.getActiveBookingForFrame(day, frame));
  }

  getBookingBadgeClasses(status: BookingStatus): string {
    return getBookingBadgeClasses(status);
  }

  emitTimeFrameAction(
    action: 'edit' | 'delete',
    slot: UserAvailabilityInterface,
    timeFrame: TimeFrameInterface,
    timeFrameIndex: number
  ): void {
    const payload = { slot, timeFrame, timeFrameIndex };
    if (action === 'edit') {
      this.editTimeFrame.emit(payload);
      return;
    }

    this.deleteTimeFrame.emit(payload);
  }
}
