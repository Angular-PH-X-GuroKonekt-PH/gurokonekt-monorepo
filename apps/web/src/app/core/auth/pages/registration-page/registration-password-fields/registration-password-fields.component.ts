import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { createPasswordVisibilityState } from '../../../../../shared/utils';
import {
  getFormErrorMessage,
  hasError,
} from '../../../../../shared/utils/form-validation.util';

@Component({
  selector: 'app-registration-password-fields',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './registration-password-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class RegistrationPasswordFieldsComponent {
  /** Used for error checks against the parent registration form. */
  readonly form = input.required<FormGroup>();
  readonly subtitle = input(
    'Create a secure password for your account'
  );

  private readonly passwordHelper = createPasswordVisibilityState();
  private readonly confirmPasswordHelper = createPasswordVisibilityState();

  protected readonly showPassword = this.passwordHelper.showPassword;
  protected readonly showConfirmPassword =
    this.confirmPasswordHelper.showPassword;

  protected togglePasswordVisibility(): void {
    this.passwordHelper.toggleVisibility();
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordHelper.toggleVisibility();
  }

  protected hasFieldError(fieldName: string): boolean {
    return hasError(this.form(), fieldName);
  }

  protected getFieldErrorMessage(fieldName: string): string {
    return getFormErrorMessage(this.form(), fieldName);
  }

  protected hasPasswordMismatch(): boolean {
    const form = this.form();
    return (
      !!form.hasError('passwordMismatch') &&
      !!form.get('confirmPassword')?.touched
    );
  }
}
