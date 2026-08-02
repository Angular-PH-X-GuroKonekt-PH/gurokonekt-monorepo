import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  getCountries,
  getLanguages,
  getTimezones,
} from '../../../../../shared/utils';
import { hasError } from '../../../../../shared/utils/form-validation.util';
import { FormFieldErrorComponent } from '../../../../../shared/components/form-field-error/form-field-error.component';

@Component({
  selector: 'app-registration-location-fields',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldErrorComponent],
  templateUrl: './registration-location-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  host: { class: 'flex flex-col gap-6' },
})
export class RegistrationLocationFieldsComponent {
  readonly form = input.required<FormGroup>();
  readonly title = input('Location & Preferences');
  readonly subtitle = input('Help us personalize your experience');
  /** Help text under country — mentee vs mentor copy. */
  readonly countryHint = input(
    'This will help us auto-select your timezone and match you with local mentors'
  );

  protected readonly countries = getCountries();
  protected readonly timezones = signal(getTimezones());
  protected readonly languages = getLanguages();

  protected hasFieldError(fieldName: string): boolean {
    return hasError(this.form(), fieldName);
  }
}
