import { Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MenteePreferredSessionType } from '@gurokonekt/models/interfaces/user/user.model';
import { FormArrayTextListComponent } from '../../../../../../shared/components/form-array-text-list/form-array-text-list.component';
import { FormFieldErrorComponent } from '../../../../../../shared/components/form-field-error/form-field-error.component';

@Component({
  selector: 'app-profile-edit-mentee-extras',
  standalone: true,
  imports: [ReactiveFormsModule, FormArrayTextListComponent, FormFieldErrorComponent],
  templateUrl: './profile-edit-mentee-extras.component.html',
  host: { class: 'block' },
})
export class ProfileEditMenteeExtrasComponent {
  readonly form = input.required<FormGroup>();
  readonly learningGoals = input.required<FormArray>();
  readonly areasOfInterest = input.required<FormArray>();
  readonly preferredSessionTypes = input.required<FormArray>();
  readonly maxLearningGoals = input.required<number>();
  readonly areasOfInterestOptions = input.required<string[]>();
  readonly menteePreferredSessionType = input.required<typeof MenteePreferredSessionType>();

  readonly toggleAreaOfInterest = output<string>();
  readonly toggleSessionType = output<MenteePreferredSessionType>();

  protected readonly interestRequiredMessage = {
    required: 'Please select at least one area of interest',
    minlength: 'Please select at least one area of interest',
  } as const;

  protected isAreaSelected(area: string): boolean {
    return (this.areasOfInterest().value as string[]).includes(area);
  }

  protected isSessionTypeSelected(type: MenteePreferredSessionType): boolean {
    return (this.preferredSessionTypes().value as MenteePreferredSessionType[]).includes(type);
  }
}
