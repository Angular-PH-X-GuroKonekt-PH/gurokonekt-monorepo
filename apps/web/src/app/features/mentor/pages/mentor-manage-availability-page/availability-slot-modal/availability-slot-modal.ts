import { TitleCasePipe } from '@angular/common';
import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AvailabilityOverrideType,
  DaysInWeek,
} from '@gurokonekt/models/interfaces/user/user.model';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-availability-slot-modal',
  imports: [FormsModule, IconComponent, TitleCasePipe],
  templateUrl: './availability-slot-modal.html',
})
export class AvailabilitySlotModal {
  readonly overrideTypes = AvailabilityOverrideType;
  days = input.required<DaysInWeek[]>();
  editingDay = input<DaysInWeek | null>(null);
  editingOverride = input(false);
  sessionDurationMinutes = input.required<number>();
  timezoneOptions = input<{ value: string; label: string }[]>([
    { value: 'UTC', label: 'UTC' },
  ]);
  showScheduleOptions = input(false);

  day = model<DaysInWeek>(DaysInWeek.Monday);
  from = model('09:00');
  to = model('10:00');
  scheduleType = model<'recurring' | AvailabilityOverrideType>('recurring');
  startDate = model('');
  endDate = model('');
  timezone = model('UTC');

  closed = output<void>();
  saved = output<void>();
}
