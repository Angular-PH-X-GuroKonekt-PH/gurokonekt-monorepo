import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store, createSelectMap } from '@ngxs/store';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  DeleteAvailabilityTargetInterface,
  DaysInWeek,
  TimeFrameInterface,
  UserAvailabilityInterface,
} from '@gurokonekt/models/interfaces/user/user.model';
import {
  BookingCardInterface,
  BookingStatus,
} from '@gurokonekt/models/interfaces/booking/booking.model';
import { AvailabilitySelectors } from '../../../../core/availability/store/availability.selectors';
import { FetchAvailability } from '../../../../core/availability/store/availability.actions';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';
import { BookingService } from '../../../../shared/services/booking.service';
import { Button } from '@gurokonekt/ui';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import {
  mapAvailabilityToCalendarEvents,
  timeToMinutes,
  toWeekInputValue,
} from './availability.helpers';
import { AvailabilityService } from '../../services/availability.service';
import { SectionTitle } from '../../../../shared/components/section-title/section-title.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { AvailabilitySlotModal } from './availability-slot-modal/availability-slot-modal';
import { DeleteAvailabilityModal } from './delete-availability-modal/delete-availability-modal';
import { AvailabilityTable } from '../../components/availability-table/availability-table';

@Component({
  selector: 'app-mentor-manage-availability-page',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    Button,
    IconComponent,
    SectionTitle,
    AvailabilitySlotModal,
    DeleteAvailabilityModal,
    AvailabilityTable,
  ],
  templateUrl: './mentor-manage-availability.page.html',
  styleUrl: './mentor-manage-availability.page.scss',
})
export class MentorManageAvailabilityPage implements OnInit {
  store = inject(Store);
  bookingService = inject(BookingService);
  availabilityService = inject(AvailabilityService);
  toastService = inject(ToastService);

  selectors = createSelectMap({
    availabilities: AvailabilitySelectors.availabilities,
    sessionDurationMinutes: AvailabilitySelectors.sessionDurationMinutes,
    isLoading: AvailabilitySelectors.isLoading,
    errorMessage: AvailabilitySelectors.errorMessage,
  });

  viewMode = signal<'table' | 'calendar'>('table');
  expandedDays = signal<DaysInWeek[]>([]);
  blockedBookings = signal<BookingCardInterface[]>([]);
  showSlotModal = signal(false);
  editingDay = signal<DaysInWeek | null>(null);
  editingTimeFrameIndex = signal<number | null>(null);
  deleteAvailabilityTarget = signal<DeleteAvailabilityTargetInterface | null>(null);
  deleteAvailabilitySubmitting = signal(false);

  selectedWeekValue = toWeekInputValue(new Date());

  days = [
    DaysInWeek.Monday,
    DaysInWeek.Tuesday,
    DaysInWeek.Wednesday,
    DaysInWeek.Thursday,
    DaysInWeek.Friday,
    DaysInWeek.Saturday,
    DaysInWeek.Sunday,
  ];

  slotForm = {
    day: DaysInWeek.Monday,
    from: '09:00',
    to: '10:00',
  };

  calendarEvents = computed(() =>
    mapAvailabilityToCalendarEvents(
      this.selectors.availabilities(),
      this.blockedBookings(),
      this.selectors.sessionDurationMinutes()
    )
  );

  calendarOptions: CalendarOptions = {
    plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek',
    },
    buttonText: {
      month: 'Month',
      week: 'Week',
      day: 'Day',
      list: 'List',
      today: 'Today',
    },
    height: 'auto',
    allDaySlot: false,
  };

  ngOnInit(): void {
    const userId = this.currentUserId;
    if (!userId) return;

    this.store.dispatch(new FetchAvailability(userId));

    this.bookingService
      .getBookingsByStatuses(userId, [
        BookingStatus.PENDING,
        BookingStatus.APPROVED,
      ])
      .subscribe((bookings) => this.blockedBookings.set(bookings));
  }

  get currentUserId(): string | null {
    return this.store.selectSnapshot(AuthSelectors.user)?.id ?? null;
  }

  setView(mode: 'table' | 'calendar'): void {
    this.viewMode.set(mode);
  }

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

  onSelectedWeekChange(value: string): void {
    this.selectedWeekValue = value;
  }

  onAddSlot(): void {
    this.editingDay.set(null);
    this.editingTimeFrameIndex.set(null);

    this.slotForm = {
      day: DaysInWeek.Monday,
      from: '09:00',
      to: '10:00',
    };

    this.showSlotModal.set(true);
  }

  onEditDay(slot: UserAvailabilityInterface): void {
    const sortedFrames = [...slot.timeFrames].sort(
      (a, b) => timeToMinutes(a.from) - timeToMinutes(b.from)
    );
    const firstFrame = sortedFrames[0];
    const lastFrame = sortedFrames[sortedFrames.length - 1];

    this.editingDay.set(slot.day);
    this.editingTimeFrameIndex.set(null);

    this.slotForm = {
      day: slot.day,
      from: firstFrame?.from ?? '09:00',
      to: lastFrame?.to ?? '10:00',
    };

    this.showSlotModal.set(true);
  }

  onEditTimeFrame(
    slot: UserAvailabilityInterface,
    timeFrame: TimeFrameInterface,
    timeFrameIndex: number
  ): void {
    this.editingDay.set(slot.day);
    this.editingTimeFrameIndex.set(timeFrameIndex);

    this.slotForm = {
      day: slot.day,
      from: timeFrame.from,
      to: timeFrame.to,
    };

    this.showSlotModal.set(true);
  }

  closeSlotModal(): void {
    this.showSlotModal.set(false);
    this.editingDay.set(null);
    this.editingTimeFrameIndex.set(null);
  }

  saveSlot(): void {
    const userId = this.currentUserId;
    if (!userId) return;

    if (timeToMinutes(this.slotForm.from) >= timeToMinutes(this.slotForm.to)) {
      this.toastService.warning('Start time must be before end time.');
      return;
    }

    const sessionDurationMinutes = this.selectors.sessionDurationMinutes();
    const frameDuration =
      timeToMinutes(this.slotForm.to) - timeToMinutes(this.slotForm.from);

    if (frameDuration < sessionDurationMinutes) {
      this.toastService.warning(`Time range must be at least ${sessionDurationMinutes} minutes.`);
      return;
    }

    if (frameDuration % sessionDurationMinutes !== 0) {
      this.toastService.warning(
        `Time range must be divisible into ${sessionDurationMinutes}-minute sessions.`
      );
      return;
    }

    const frame: TimeFrameInterface = {
      from: this.slotForm.from,
      to: this.slotForm.to,
    };

    const editingDay = this.editingDay();
    const editingTimeFrameIndex = this.editingTimeFrameIndex();

    if (editingDay && editingTimeFrameIndex !== null) {
      this.availabilityService
        .updateAvailabilitySlot(userId, {
          day: editingDay,
          timeFrameIndex: editingTimeFrameIndex,
          timeFrame: frame,
        })
        .subscribe({
          next: () => {
            this.store.dispatch(new FetchAvailability(userId));
            this.closeSlotModal();
            this.toastService.success('Availability updated successfully.');
          },
          error: (error) => {
            this.toastService.error(error?.error?.message ?? 'Failed to update availability.');
          },
        });

      return;
    }

    if (editingDay) {
      const updatedAvailability = this.selectors.availabilities().map((slot) =>
        slot.day === editingDay
          ? { ...slot, timeFrames: [frame] }
          : slot
      );

      this.availabilityService
        .updateAvailability(userId, {
          availability: updatedAvailability,
          sessionDurationMinutes,
        })
        .subscribe({
          next: () => {
            this.store.dispatch(new FetchAvailability(userId));
            this.closeSlotModal();
            this.toastService.success('Availability updated successfully.');
          },
          error: (error) => {
            this.toastService.error(error?.error?.message ?? 'Failed to update availability.');
          },
        });

      return;
    }

    this.availabilityService
      .addAvailabilitySlot(userId, {
        day: this.slotForm.day,
        timeFrames: [frame],
      })
      .subscribe({
        next: () => {
          this.store.dispatch(new FetchAvailability(userId));
          this.closeSlotModal();
          this.toastService.success('Availability added successfully.');
        },
        error: (error) => {
          this.toastService.error(error?.error?.message ?? 'Failed to add availability.');
        },
      });
  }

  onDeleteDay(slot: UserAvailabilityInterface): void {
    this.deleteAvailabilityTarget.set({ slot });
  }

  onDeleteTimeFrame(
    slot: UserAvailabilityInterface,
    timeFrame: TimeFrameInterface,
    timeFrameIndex: number
  ): void {
    this.deleteAvailabilityTarget.set({ slot, timeFrame, timeFrameIndex });
  }

  closeDeleteAvailabilityModal(): void {
    if (this.deleteAvailabilitySubmitting()) return;

    this.deleteAvailabilityTarget.set(null);
  }

  confirmDeleteAvailability(): void {
    const target = this.deleteAvailabilityTarget();
    const userId = this.currentUserId;

    if (!target || !userId) return;

    this.deleteAvailabilitySubmitting.set(true);

    this.availabilityService
      .deleteAvailabilitySlot(userId, {
        day: target.slot.day,
        timeFrameIndex: target.timeFrameIndex,
      })
      .subscribe({
        next: () => {
          this.deleteAvailabilitySubmitting.set(false);
          this.deleteAvailabilityTarget.set(null);
          this.store.dispatch(new FetchAvailability(userId));
          this.toastService.success('Availability deleted successfully.');
        },
        error: (error) => {
          this.deleteAvailabilitySubmitting.set(false);
          this.toastService.error(error?.error?.message ?? 'Failed to delete availability.');
        },
      });
  }

}
