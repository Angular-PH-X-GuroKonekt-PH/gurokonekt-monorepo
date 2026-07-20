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
import { VALIDATION_PATTERNS } from '../../../../shared/constants/validation-patterns.constants';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { createPasswordVisibilityState } from '../../../../shared/utils';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, NgOptimizedImage, IconComponent],
  templateUrl: './reset-password-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage extends BaseFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly accessToken = signal<string | null>(null);
  private readonly passwordVisibility = createPasswordVisibilityState();

  protected readonly isSubmitting = signal(false);
  protected readonly linkError = signal<string | null>(null);
  protected readonly showPassword = this.passwordVisibility.showPassword;
  protected readonly showConfirmPassword =
    this.passwordVisibility.showConfirmPassword;

  protected readonly resetPasswordForm = this.formBuilder.nonNullable.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(VALIDATION_PATTERNS.PASSWORD),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: CustomValidators.passwordMatchValidator }
  );

  protected readonly form: FormGroup = this.resetPasswordForm;

  constructor() {
    super();
    this.captureRecoveryToken();
  }

  protected async onSubmit(): Promise<void> {
    const accessToken = this.accessToken();

    if (!accessToken) {
      this.linkError.set('This password reset link is invalid or has expired.');
      return;
    }

    if (
      !preSubmissionValidation(
        this.resetPasswordForm,
        this.isSubmitting()
      )
    ) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { password, confirmPassword } =
        this.resetPasswordForm.getRawValue();

      const response = await firstValueFrom(
        this.authService.completePasswordReset({
          accessToken,
          newPassword: password,
          confirmPassword,
        })
      );

      this.toastService.success(
        response.message || 'Your password has been updated successfully.',
        'Password updated'
      );

      await this.router.navigate([APP_ROUTES.LOGIN]);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Unable to reset your password. Please request a new reset link.';

      this.toastService.error(message, 'Password reset failed');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisibility.togglePasswordVisibility();
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.passwordVisibility.toggleConfirmPasswordVisibility();
  }

  protected requestNewLink(): void {
    this.router.navigate([APP_ROUTES.FORGOT_PASSWORD]);
  }

  protected navigateToLogin(): void {
    this.router.navigate([APP_ROUTES.LOGIN]);
  }

  private captureRecoveryToken(): void {
    if (typeof window === 'undefined') {
      this.linkError.set('This password reset link is invalid or has expired.');
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const queryParams = new URLSearchParams(window.location.search.slice(1));
    const params = hashParams.size > 0 ? hashParams : queryParams;
    const errorDescription = params.get('error_description');
    const token = params.get('access_token');
    const type = params.get('type');

    if (errorDescription || !token || type !== 'recovery') {
      this.linkError.set(
        errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'This password reset link is invalid or has expired.'
      );
      return;
    }

    this.accessToken.set(token);

    // Remove the recovery token from the address bar after capturing it.
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}
