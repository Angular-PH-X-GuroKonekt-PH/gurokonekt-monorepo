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
  selector: 'app-registration-name-fields',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './registration-name-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
  // Block-level flex so parent gap + inner gaps match field spacing.
  host: { class: 'flex flex-col gap-6' },
})
export class RegistrationNameFieldsComponent {
  readonly form = input.required<FormGroup>();

  protected hasFieldError(fieldName: string): boolean {
    return hasError(this.form(), fieldName);
  }

  protected getFieldErrorMessage(fieldName: string): string {
    return getFormErrorMessage(this.form(), fieldName);
  }
}
