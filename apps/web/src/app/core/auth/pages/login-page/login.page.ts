import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { createSelectMap, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { createPasswordVisibilityState } from '../../../../shared/utils';
import { ToastService } from '../../../../shared/services/toast.service';
import { BaseFormComponent } from '../../../../shared/base-form/base-form.component';
import * as AuthActions from '../../store/auth.actions';
import { preSubmissionValidation } from '../../../../shared/helpers/form-submission.helper';
import { Router } from '@angular/router';
import { APP_ROUTES } from 'apps/web/src/app/shared/constants/routes';
import { requiresProfileSetup } from 'apps/web/src/app/shared/utils/profile-completion.util';
import { AuthSelectors } from '../../store/auth.selectors';
import {
  hasEmailVerificationCallbackHash,
  redirectToVerifyEmailCallback,
} from '../../../../shared/utils/email-verification.util';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, IconComponent, NgOptimizedImage],
  templateUrl: './login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage extends BaseFormComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly passwordHelper = createPasswordVisibilityState();

  protected readonly showPassword = this.passwordHelper.showPassword;

  protected readonly selectSignal = createSelectMap({
    isLoginLoading: AuthSelectors.isLoginLoading,
    errorMessage: AuthSelectors.errorMessage,
    successMessage: AuthSelectors.successMessage,
  });

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });
  protected readonly form: FormGroup = this.loginForm;

  constructor() {
    super();

    let lastErrorNotified: string | null = null;

    effect(() => {
      const errorMsg = this.selectSignal.errorMessage();

      if (errorMsg && errorMsg !== lastErrorNotified) {
        lastErrorNotified = errorMsg;
        this.toastService.errorExclusive(errorMsg, 'Login Failed');
      }

      if (!errorMsg) {
        lastErrorNotified = null;
      }
    });
  }

  ngOnInit(): void {
    this.redirectEmailVerificationCallbackIfPresent();
  }

  protected togglePasswordVisibility(): void {
    this.passwordHelper.toggleVisibility();
  }

  protected async onSubmit(): Promise<void> {
    if (!preSubmissionValidation(this.loginForm, this.selectSignal.isLoginLoading())) {
      return;
    }

    try {
      const { email, password } = this.loginForm.getRawValue();

      await firstValueFrom(
        this.store.dispatch(new AuthActions.Login({ email, password }))
      );

      const user = this.store.selectSnapshot(AuthSelectors.user);
      if (user) {
        if (requiresProfileSetup(user.role, user.isProfileComplete, user.isMentorProfileComplete)) {
          await this.router.navigate([APP_ROUTES.PROFILE_SETUP]);
          return;
        }

        await this.router.navigate([APP_ROUTES.DASHBOARD]);
      }
    } catch {
      // Error is already reflected in the errorMessage signal via state
    }
  }

  protected navigateToRegister(): void {
    this.store.dispatch(new AuthActions.ClearAuthMessages());
    this.router.navigate([APP_ROUTES.REGISTER]);
  }

  protected navigateToForgotPassword(): void {
    this.toastService.info('Forgot password is not available yet.');
  }

  private redirectEmailVerificationCallbackIfPresent(): void {
    if (hasEmailVerificationCallbackHash()) {
      redirectToVerifyEmailCallback();
    }
  }
}
