import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  getFormErrorMessage,
  hasError,
} from '../../../../../shared/utils/form-validation.util';

@Component({
  selector: 'app-registration-email-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './registration-email-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class RegistrationEmailFieldComponent {
  readonly form = input.required<FormGroup>();

  protected hasEmailError(): boolean {
    return hasError(this.form(), 'email');
  }

  protected getEmailErrorMessage(): string {
    return getFormErrorMessage(this.form(), 'email');
  }
}
