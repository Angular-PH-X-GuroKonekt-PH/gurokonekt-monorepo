import { Component, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PasswordVisibilityHelper } from '../../../../shared/helpers';
import { ToastService } from '../../../../shared/services/toast.service';
import { BaseFormComponent } from '../../../../shared/base-form/base-form.component';
import { AuthState } from '../../store/auth.state';
import * as AuthActions from '../../store/auth.actions';
import { FormSubmissionHelper } from '../../../../shared/helpers/form-submission.helper';
import { Router } from '@angular/router'; 
import { APP_ROUTES } from 'apps/web/src/app/shared/constants/routes';
import { requiresProfileSetup } from 'apps/web/src/app/shared/helpers/profile-completion.helper';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.page.html',
})
export class LoginPage extends BaseFormComponent {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly passwordHelper = new PasswordVisibilityHelper();

  protected readonly showPassword = this.passwordHelper.showPassword;
  protected readonly isLoading = this.store.selectSignal(AuthState.isLoginLoading);
  protected readonly errorMessage = this.store.selectSignal(AuthState.errorMessage);
  protected readonly successMessage = this.store.selectSignal(AuthState.successMessage);

  protected readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });
  protected readonly form: FormGroup = this.loginForm;

  constructor() {
    super();

    effect(() => {
      const errorMsg = this.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });
  }

  protected togglePasswordVisibility(): void {
    this.passwordHelper.toggleVisibility();
  }

  protected async onSubmit(): Promise<void> {
    if (!FormSubmissionHelper.preSubmissionValidation(this.loginForm, this.isLoading)) {
      return;
    }

    try {
      await firstValueFrom(
        this.store.dispatch(new AuthActions.Login({
          email: this.loginForm.value.email,
          password: this.loginForm.value.password,
        }))
      );

      const user = this.store.selectSnapshot(AuthState.user);
      if (user) {
        if (requiresProfileSetup(user.role, user.isProfileComplete, user.isMentorProfileComplete)) {
            this.router.navigate([APP_ROUTES.PROFILE_SETUP]);
        }
        this.router.navigate([APP_ROUTES.DASHBOARD]);
      }
    } catch {
      // Error is already reflected in the errorMessage signal via state
    }
  }

  protected navigateToRegister(): void {
    this.router.navigate([APP_ROUTES.REGISTER]);
  }

  protected navigateToForgotPassword(): void {
    this.toastService.info('Forgot password is not available yet.');
  }
}
