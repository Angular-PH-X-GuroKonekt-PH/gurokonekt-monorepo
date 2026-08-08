import { Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../../../../../../shared/components/icon/icon.component';
import { FormArrayTextListComponent } from '../../../../../../shared/components/form-array-text-list/form-array-text-list.component';
import type { DayAvailability, TimeFrame } from '../../../../../../shared/interfaces/post-login.interface';
import { formatTimeRange } from '../../../../../../features/mentor/pages/mentor-manage-availability-page/availability.helpers';
import { EXPERTISE_OPTIONS } from '../../../../../../shared/constants/expertise.constants';

@Component({
  selector: 'app-profile-edit-mentor-extras',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, FormArrayTextListComponent],
  templateUrl: './profile-edit-mentor-extras.component.html',
  host: { class: 'block' },
})
export class ProfileEditMentorExtrasComponent {
  readonly form = input.required<FormGroup>();
  readonly skills = input.required<FormArray>();
  readonly areasOfExpertise = input.required<FormArray>();
  readonly maxSkills = input.required<number>();
  readonly maxAreasOfExpertise = input.required<number>();
  readonly availabilitySchedule = input.required<DayAvailability[]>();

  readonly manageAvailability = output<void>();

  protected readonly expertiseSuggestions = EXPERTISE_OPTIONS;

  protected formatAvailabilityTimeRange(timeFrame: TimeFrame): string {
    return formatTimeRange(timeFrame);
  }
}
