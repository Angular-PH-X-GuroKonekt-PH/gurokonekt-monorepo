import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { BaseFormComponent } from '../../../../shared/base-form/base-form.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { preSubmissionValidation } from '../../../../shared/helpers/form-submission.helper';
import { APP_ROUTES } from '../../../../shared/constants/routes';

@Component({
  selector: 'app-forget-password-page',
  imports: [ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './forget-password-page.html',
  styleUrl: './forget-password-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgetPasswordPage extends BaseFormComponent {
  formBuilder = inject(FormBuilder);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  isSubmitting = signal(false);

  loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  form: FormGroup = this.loginForm;

  // Preserves the reference currently used by your HTML.
  selectSignal = {
    isLoginLoading: this.isSubmitting,
  };

  protected async onSubmit(): Promise<void> {
    if (!preSubmissionValidation(this.loginForm, this.isSubmitting())) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { email } = this.loginForm.getRawValue();

      const response = await firstValueFrom(
        this.authService.forgotPassword(email.trim()),
      );

      this.toastService.success(
        response.message ||
          'If an account exists for this email, a password reset link has been sent.',
        'Check your email',
      );

      this.loginForm.reset();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Unable to send the password reset link. Please try again.';

      this.toastService.error(message, 'Unable to send reset link');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected navigateToLogin(): void {
    this.router.navigate([APP_ROUTES.LOGIN]);
  }
}
