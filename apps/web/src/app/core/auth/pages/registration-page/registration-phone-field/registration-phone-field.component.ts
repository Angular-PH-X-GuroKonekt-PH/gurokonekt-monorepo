import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  getPhoneErrorMessage,
  getPhoneFormatPlaceholder,
  getSelectedPhoneCountry,
} from '@gurokonekt/utils';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { getCountries } from '../../../../../shared/utils';
import { hasError } from '../../../../../shared/utils/form-validation.util';

@Component({
  selector: 'app-registration-phone-field',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './registration-phone-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class RegistrationPhoneFieldComponent {
  readonly form = input.required<FormGroup>();

  protected readonly countries = getCountries();
  protected readonly showPhoneCountryDropdown = signal(false);
  protected readonly selectedPhoneCountry = signal('PH');

  protected togglePhoneCountryDropdown(): void {
    this.showPhoneCountryDropdown.update((open) => !open);
  }

  protected closePhoneCountryDropdown(): void {
    this.showPhoneCountryDropdown.set(false);
  }

  protected selectPhoneCountry(countryCode: string): void {
    this.selectedPhoneCountry.set(countryCode);
    this.closePhoneCountryDropdown();
  }

  protected getSelectedPhoneCountry() {
    return getSelectedPhoneCountry(this.selectedPhoneCountry());
  }

  protected getPhoneFormatPlaceholder(): string {
    return getPhoneFormatPlaceholder(this.selectedPhoneCountry());
  }

  protected hasPhoneError(): boolean {
    return hasError(this.form(), 'phoneNumber');
  }

  protected getPhoneErrorMessage(): string {
    return getPhoneErrorMessage(this.form().get('phoneNumber')?.errors);
  }
}
