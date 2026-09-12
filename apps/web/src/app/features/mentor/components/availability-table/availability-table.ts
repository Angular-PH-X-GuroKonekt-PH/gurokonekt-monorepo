import { Component, input, output, signal } from '@angular/core';
import {
  AvailabilityOverrideInterface,
  AvailabilityOverrideType,
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
  getAvailabilityOverrideForDate,
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

type ScheduleFilter = 'all' | 'recurring' | 'date-specific';

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
  availabilityTimezone = input('UTC');
  availabilityOverrides = input<AvailabilityOverrideInterface[]>([]);
  selectedWeekValue = input.required<string>();
  showWeekPicker = input(true);
  viewMode = input<'setup' | 'management'>('management');
  selectedWeekChange = output<string>();
  editDay = output<UserAvailabilityInterface>();
  deleteDay = output<UserAvailabilityInterface>();
  editTimeFrame = output<AvailabilityTimeFrameAction>();
  deleteTimeFrame = output<AvailabilityTimeFrameAction>();
  editOverride = output<AvailabilityOverrideInterface>();
  deleteOverride = output<string>();

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
  readonly scheduleFilter = signal<ScheduleFilter>('all');

  formatTimeRange = formatTimeRange;

  setScheduleFilter(event: Event): void {
    this.scheduleFilter.set(
      (event.target as HTMLSelectElement).value as ScheduleFilter,
    );
  }

  getVisibleDays(): DaysInWeek[] {
    if (this.scheduleFilter() === 'all') return this.days;

    return this.days.filter((day) => {
      const override = this.getOverrideForDay(day);
      return this.scheduleFilter() === 'date-specific'
        ? override !== null
        : override === null &&
            this.availabilities().some((slot) => slot.day === day);
    });
  }

  isDayExpanded(day: DaysInWeek): boolean {
    return this.expandedDays().includes(day);
  }

  toggleDayDetails(day: DaysInWeek): void {
    this.expandedDays.update((expandedDays) =>
      expandedDays.includes(day)
        ? expandedDays.filter((expandedDay) => expandedDay !== day)
        : [...expandedDays, day],
    );
  }

  getAvailabilityForDay(day: DaysInWeek): UserAvailabilityInterface | null {
    const override = this.getOverrideForDay(day);
    if (override) {
      return {
        day,
        timeFrames:
          override.type === AvailabilityOverrideType.Unavailable
            ? []
            : override.timeFrames,
      };
    }

    return this.availabilities().find((slot) => slot.day === day) ?? null;
  }

  getOverrideForDay(day: DaysInWeek): AvailabilityOverrideInterface | null {
    const date = this.getDateForDay(day);
    const dateKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    return getAvailabilityOverrideForDate(
      this.availabilityOverrides(),
      dateKey,
    );
  }

  getScheduleSourceLabel(day: DaysInWeek): string | null {
    const override = this.getOverrideForDay(day);
    if (!override) {
      return this.getAvailabilityForDay(day) ? 'Recurring' : null;
    }

    return {
      [AvailabilityOverrideType.CustomHours]: 'Custom',
      [AvailabilityOverrideType.Temporary]: 'Temporary',
      [AvailabilityOverrideType.Unavailable]: 'Unavailable',
    }[override.type];
  }

  getScheduleSourceClasses(day: DaysInWeek): string {
    const type = this.getOverrideForDay(day)?.type;
    if (type === AvailabilityOverrideType.Unavailable) {
      return 'bg-red-50 text-red-700';
    }
    if (type) {
      return 'bg-orange-50 text-orange-700';
    }
    return 'bg-blue-50 text-blue-700';
  }

  getTimezoneForDay(day: DaysInWeek): string {
    return this.getOverrideForDay(day)?.timezone ?? this.availabilityTimezone();
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
      this.sessionDurationMinutes(),
      this.getTimezoneForDay(day),
    );
  }

  getBookingSummaryLabel(day: DaysInWeek): string {
    const bookings: ActiveBookingSummaryInterface[] =
      getActiveBookingSummariesForDay(
        this.getAvailabilityForDay(day),
        this.getDateForDay(day),
        this.blockedBookings(),
        this.sessionDurationMinutes(),
        this.getTimezoneForDay(day),
      );

    return getBookingSummaryLabel(bookings);
  }

  getActiveBookingForFrame(
    day: DaysInWeek,
    frame: TimeFrameInterface,
  ): BookingCardInterface | null {
    return getActiveBookingForFrame(
      frame,
      this.getDateForDay(day),
      this.blockedBookings(),
      this.sessionDurationMinutes(),
      this.getTimezoneForDay(day),
    );
  }

  getBlockedTimeForFrame(
    day: DaysInWeek,
    frame: TimeFrameInterface,
  ): string | null {
    const booking = this.getActiveBookingForFrame(day, frame);
    return booking
      ? formatBookingTime(
          booking,
          this.sessionDurationMinutes(),
          this.getTimezoneForDay(day),
        )
      : null;
  }

  getTimeFrameStatus(
    day: DaysInWeek,
    frame: TimeFrameInterface,
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
    timeFrameIndex: number,
  ): void {
    const payload = { slot, timeFrame, timeFrameIndex };
    if (action === 'edit') {
      this.editTimeFrame.emit(payload);
      return;
    }

    this.deleteTimeFrame.emit(payload);
  }
}
