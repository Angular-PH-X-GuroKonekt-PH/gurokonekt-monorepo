import { Component, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PasswordVisibilityHelper } from '../../../../shared/helpers';
import { ToastService } from '../../../../shared/services/toast.service';
import { BaseFormComponent } from '../../../../shared/base-form/base-form.component';
import { NavigationHelper } from '../../../../shared/helpers';
import { AuthState } from '../../store/auth.state';
import * as AuthActions from '../../store/auth.actions';
import { FormSubmissionHelper } from '../../../../shared/helpers/form-submission.helper';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.page.html',
})
export class LoginPage extends BaseFormComponent {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly navigationHelper = inject(NavigationHelper);
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
        this.toastService.success('Login successful!', 'Welcome Back!');
        this.navigationHelper.navigateToDashboard(
          user.role,
          user.isProfileComplete,
          user.isMentorProfileComplete
        );
      }
    } catch {
      // Error is already reflected in the errorMessage signal via state
    }
  }

  protected navigateToRegister(): void {
    this.navigationHelper.navigateToRoleSelection();
  }

  protected navigateToForgotPassword(): void {
    this.toastService.info('Forgot password is not available yet.');
  }
}
