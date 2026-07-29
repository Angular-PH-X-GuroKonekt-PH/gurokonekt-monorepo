import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { FormFieldErrorComponent } from '../../../../../../shared/components/form-field-error/form-field-error.component';
import { hasError } from '../../../../../../shared/utils/form-validation.util';

@Component({
  selector: 'app-profile-edit-personal-info',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldErrorComponent],
  templateUrl: './profile-edit-personal-info.component.html',
  host: { class: 'block' },
})
export class ProfileEditPersonalInfoComponent {
  readonly form = input.required<FormGroup>();
  readonly isMentor = input(false);
  readonly countryOptions = input.required<{ value: string; label: string }[]>();
  readonly timezoneOptions = input.required<{ value: string; label: string }[]>();
  readonly languageOptions = input.required<{ value: string; label: string }[]>();

  protected readonly yearsOfExperienceMessages = {
    min: 'Years of experience must be between 1 and 60',
    max: 'Years of experience must be between 1 and 60',
  } as const;

  protected fieldHasError(controlName: string): boolean {
    return hasError(this.form(), controlName);
  }
}
