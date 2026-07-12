import {
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  DaysInWeek,
  TimeFrameInterface,
  UserAvailabilityInterface,
} from '@gurokonekt/models/interfaces/user/user.model';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import type {
  DayAvailability,
  TimeFrame,
} from '../../../../../shared/interfaces/post-login.interface';
import { ToastService } from '../../../../../shared/services/toast.service';
import { AvailabilitySlotModal } from '../../mentor-manage-availability-page/availability-slot-modal/availability-slot-modal';
import {
  toWeekInputValue,
} from '../../mentor-manage-availability-page/availability.helpers';
import {
  AvailabilityTable,
  AvailabilityTimeFrameAction,
} from '../../../components/availability-table/availability-table';
import { validateAvailabilityFrames } from '../../../utils/availability-validation.util';

@Component({
  selector: 'app-mentor-weekly-availability',
  imports: [AvailabilityTable, AvailabilitySlotModal, IconComponent],
  templateUrl: './mentor-weekly-availability.html',
})
export class MentorWeeklyAvailability implements OnInit {
  private static readonly MAX_TIME_FRAMES_PER_DAY = 3;
  toastService = inject(ToastService);

  initialAvailability = input<UserAvailabilityInterface[]>([]);
  sessionDurationMinutes = input(60);
  availabilityChange = output<UserAvailabilityInterface[]>();

  days = Object.values(DaysInWeek);
  selectedWeekValue = toWeekInputValue(new Date());
  schedule = signal<DayAvailability[]>([]);
  showSlotModal = signal(false);
  editingDay = signal<DaysInWeek | null>(null);
  editingTimeFrameIndex = signal<number | null>(null);

  slotForm = {
    day: DaysInWeek.Monday,
    from: '09:00',
    to: '10:00',
  };

  ngOnInit(): void {
    const initialByDay = new Map(
      this.initialAvailability().map((availability) => [
        availability.day,
        availability.timeFrames,
      ])
    );

    this.schedule.set(
      this.days.map((day) => ({
        day,
        enabled: initialByDay.has(day),
        timeFrames: initialByDay.get(day) ?? [this.createDefaultTimeFrame()],
      }))
    );
    this.emitAvailability();
  }

  getEnabledAvailability(): UserAvailabilityInterface[] {
    return this.schedule()
      .filter((day) => day.enabled)
      .map(({ day, timeFrames }) => ({
        day,
        timeFrames: timeFrames.map((frame) => ({ ...frame })),
      }));
  }

  openAddAvailability(): void {
    this.editingDay.set(null);
    this.editingTimeFrameIndex.set(null);
    this.slotForm = {
      day: DaysInWeek.Monday,
      from: '09:00',
      to: '10:00',
    };
    this.showSlotModal.set(true);
  }

  openEditAvailability(slot: UserAvailabilityInterface): void {
    const firstFrame = slot.timeFrames[0] ?? this.createDefaultTimeFrame();
    this.editingDay.set(slot.day);
    this.editingTimeFrameIndex.set(null);
    this.slotForm = {
      day: slot.day,
      from: firstFrame.from,
      to: firstFrame.to,
    };
    this.showSlotModal.set(true);
  }

  openEditTimeFrame(action: AvailabilityTimeFrameAction): void {
    this.editingDay.set(action.slot.day);
    this.editingTimeFrameIndex.set(action.timeFrameIndex);
    this.slotForm = {
      day: action.slot.day,
      from: action.timeFrame.from,
      to: action.timeFrame.to,
    };
    this.showSlotModal.set(true);
  }

  closeSlotModal(): void {
    this.showSlotModal.set(false);
    this.editingDay.set(null);
    this.editingTimeFrameIndex.set(null);
  }

  saveSlot(): void {
    const frame: TimeFrameInterface = {
      from: this.slotForm.from,
      to: this.slotForm.to,
    };
    const day = this.editingDay() ?? this.slotForm.day;
    const frameIndex = this.editingTimeFrameIndex();
    const daySchedule = this.schedule().find((entry) => entry.day === day);

    if (!daySchedule) return;

    const framesToValidate = this.getFramesAfterSave(
      daySchedule,
      frame,
      frameIndex
    );

    const validationError = validateAvailabilityFrames(
      framesToValidate,
      this.sessionDurationMinutes()
    );

    if (validationError) {
      this.toastService.warning(validationError);
      return;
    }

    if (
      !this.editingDay() &&
      daySchedule.enabled &&
      daySchedule.timeFrames.length >= MentorWeeklyAvailability.MAX_TIME_FRAMES_PER_DAY
    ) {
      this.toastService.warning('A day can have up to 3 time slots.');
      return;
    }

    this.updateDay(day, (draft) => {
      if (frameIndex !== null) {
        draft.timeFrames[frameIndex] = frame;
      } else if (this.editingDay()) {
        draft.timeFrames = [frame];
      } else if (draft.enabled) {
        draft.timeFrames = [...draft.timeFrames, frame];
      } else {
        draft.enabled = true;
        draft.timeFrames = [frame];
      }
    });

    this.closeSlotModal();
  }

  deleteDay(slot: UserAvailabilityInterface): void {
    this.updateDay(slot.day, (draft) => {
      draft.enabled = false;
      draft.timeFrames = [this.createDefaultTimeFrame()];
    });
  }

  deleteTimeFrame(action: AvailabilityTimeFrameAction): void {
    this.updateDay(action.slot.day, (draft) => {
      draft.timeFrames.splice(action.timeFrameIndex, 1);

      if (draft.timeFrames.length === 0) {
        draft.enabled = false;
        draft.timeFrames = [this.createDefaultTimeFrame()];
      }
    });
  }

  updateDay(
    day: DaysInWeek,
    update: (draft: DayAvailability) => void
  ): void {
    const nextSchedule = this.schedule().map((entry) => ({
      ...entry,
      timeFrames: entry.timeFrames.map((frame) => ({ ...frame })),
    }));
    const daySchedule = nextSchedule.find((entry) => entry.day === day);

    if (!daySchedule) return;

    update(daySchedule);
    this.schedule.set(nextSchedule);
    this.emitAvailability();
  }

  emitAvailability(): void {
    this.availabilityChange.emit(this.getEnabledAvailability());
  }

  getFramesAfterSave(
    daySchedule: DayAvailability,
    frame: TimeFrameInterface,
    frameIndex: number | null
  ): TimeFrameInterface[] {
    if (frameIndex !== null) {
      return daySchedule.timeFrames.map((currentFrame, index) =>
        index === frameIndex ? frame : currentFrame
      );
    }

    if (this.editingDay()) {
      return [frame];
    }

    return daySchedule.enabled
      ? [...daySchedule.timeFrames, frame]
      : [frame];
  }

  createDefaultTimeFrame(): TimeFrame {
    return { from: '09:00', to: '17:00' };
  }
}
