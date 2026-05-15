import { Component, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store, createSelectMap } from '@ngxs/store';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';
import { BookingCardInterface, BookingStatus } from '@gurokonekt/models/interfaces/booking/booking.model';
import { AvailabilitySelectors } from '../../../../core/availability/store/availability.selectors';
import { FetchAvailability } from '../../../../core/availability/store/availability.actions';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';
import { BookingService } from '../../../../shared/services/booking.service';
import { Button } from '@gurokonekt/ui';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { mapAvailabilityToCalendarEvents, formatTimeRange, isSlotBlocked } from './availability.helpers';

@Component({
  selector: 'app-mentor-manage-availability-page',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, Button, IconComponent],
  templateUrl: './mentor-manage-availability.page.html',
  styleUrl: './mentor-manage-availability.page.scss',
})
export class MentorManageAvailabilityPage implements OnInit {
  @ViewChild('calendarEl') calendarComponent!: FullCalendarComponent;

  private readonly store = inject(Store);
  private readonly bookingService = inject(BookingService);

  protected readonly selectors = createSelectMap({
    availabilities: AvailabilitySelectors.availabilities,
    sessionDurationMinutes: AvailabilitySelectors.sessionDurationMinutes,
    isLoading: AvailabilitySelectors.isLoading,
    errorMessage: AvailabilitySelectors.errorMessage,
  });

  protected readonly viewMode = signal<'calendar' | 'table'>('calendar');
  protected readonly calendarViewType = signal<'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');
  protected readonly blockedBookings = signal<BookingCardInterface[]>([]);

  protected readonly calendarEvents = computed(() =>
    mapAvailabilityToCalendarEvents(
      this.selectors.availabilities(),
      this.blockedBookings(),
      this.selectors.sessionDurationMinutes()
    )
  );

  protected readonly calendarOptions: CalendarOptions = {
    plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
    height: 'auto',
    allDaySlot: false,
  };

  protected readonly formatTimeRange = formatTimeRange;
  protected readonly isSlotBlocked = isSlotBlocked;

  ngOnInit(): void {
    const userId = this.store.selectSnapshot(AuthSelectors.user)?.id;
    if (!userId) return;
    this.store.dispatch(new FetchAvailability(userId));
    this.bookingService
      .getBookingsByStatuses(userId, [BookingStatus.APPROVED])
      .subscribe((bookings) => this.blockedBookings.set(bookings));
  }

  protected setView(mode: 'calendar' | 'table'): void {
    this.viewMode.set(mode);
  }

  protected setCalendarView(type: 'timeGridWeek' | 'dayGridMonth'): void {
    this.calendarViewType.set(type);
    this.calendarComponent?.getApi().changeView(type);
  }

  protected onAddSlot(): void { /* TODO: Task 3 */ }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onEditSlot(_slot: UserAvailabilityInterface): void { /* TODO: Task 4 */ }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onDeleteSlot(_slot: UserAvailabilityInterface): void { /* TODO: Task 5 */ }
}
