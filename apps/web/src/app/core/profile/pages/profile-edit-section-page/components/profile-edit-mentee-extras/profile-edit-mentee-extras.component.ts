import { Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MenteePreferredSessionType } from '@gurokonekt/models/interfaces/user/user.model';
import { FormArrayTextListComponent } from '../../../../../../shared/components/form-array-text-list/form-array-text-list.component';
import { INTEREST_OPTIONS } from '../../../../../../shared/constants/interest.constants';

@Component({
  selector: 'app-profile-edit-mentee-extras',
  standalone: true,
  imports: [ReactiveFormsModule, FormArrayTextListComponent],
  templateUrl: './profile-edit-mentee-extras.component.html',
  host: { class: 'block' },
})
export class ProfileEditMenteeExtrasComponent {
  readonly form = input.required<FormGroup>();
  readonly learningGoals = input.required<FormArray>();
  readonly areasOfInterest = input.required<FormArray>();
  readonly preferredSessionTypes = input.required<FormArray>();
  readonly maxLearningGoals = input.required<number>();
  readonly maxAreasOfInterest = input.required<number>();
  readonly menteePreferredSessionType = input.required<typeof MenteePreferredSessionType>();

  readonly toggleSessionType = output<MenteePreferredSessionType>();

  protected readonly interestSuggestions = INTEREST_OPTIONS;

  protected isSessionTypeSelected(type: MenteePreferredSessionType): boolean {
    return (this.preferredSessionTypes().value as MenteePreferredSessionType[]).includes(type);
  }
}
