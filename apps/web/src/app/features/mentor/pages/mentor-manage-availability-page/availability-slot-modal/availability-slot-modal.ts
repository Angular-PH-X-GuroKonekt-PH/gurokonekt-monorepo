import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-availability-slot-modal',
  imports: [FormsModule, IconComponent],
  templateUrl: './availability-slot-modal.html',
})
export class AvailabilitySlotModal {
  days = input.required<DaysInWeek[]>();
  editingDay = input<DaysInWeek | null>(null);
  sessionDurationMinutes = input.required<number>();

  day = model<DaysInWeek>(DaysInWeek.Monday);
  from = model('09:00');
  to = model('10:00');

  closed = output<void>();
  saved = output<void>();
}
