import { Component, input, output } from '@angular/core';
import {
  TimeFrameInterface,
  UserAvailabilityInterface,
} from '@gurokonekt/models/interfaces/user/user.model';
import { formatTimeRange } from '../availability.helpers';

@Component({
  selector: 'app-delete-availability-modal',
  standalone: true,
  imports: [],
  templateUrl: './delete-availability-modal.html',
})
export class DeleteAvailabilityModal {
  slot = input.required<UserAvailabilityInterface>();
  timeFrame = input<TimeFrameInterface | null>(null);
  submitting = input(false);

  closed = output<void>();
  confirmed = output<void>();

  get title(): string {
    return this.timeFrame()
      ? `Delete ${this.slot().day} ${this.timeFrameLabel}?`
      : `Delete ${this.slot().day} availability?`;
  }

  get description(): string {
    return this.timeFrame()
      ? 'This will remove only this available time frame.'
      : 'This will remove all available time frames for this day.';
  }

  get timeFrameLabel(): string {
    const frame = this.timeFrame();
    return frame ? formatTimeRange(frame) : '';
  }
}
