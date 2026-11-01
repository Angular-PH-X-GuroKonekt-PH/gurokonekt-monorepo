import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { createSelectMap, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PasskeySignInButtonComponent } from '../../components/passkey-sign-in-button/passkey-sign-in-button.component';
import {
  GoogleCredential,
  GoogleSignInButton,
} from '../../components/google-sign-in-button/google-sign-in-button.component';
import { createPasswordVisibilityState } from '../../../../shared/utils';
import { ToastService } from '../../../../shared/services/toast.service';
import { BaseFormComponent } from '../../../../shared/base-form/base-form.component';
import * as AuthActions from '../../store/auth.actions';
import { preSubmissionValidation } from '../../../../shared/helpers/form-submission.helper';
import { Router } from '@angular/router';
import { APP_ROUTES } from 'apps/web/src/app/shared/constants/routes';
import { continueAfterGoogle, navigateAfterLogin } from '../../helpers/post-login-navigation.helper';
import { AuthSelectors } from '../../store/auth.selectors';
import { environment } from '../../../../../environments/environment';
import {
  hasEmailVerificationCallbackHash,
  hasPasswordRecoveryCallbackHash,
  redirectToPasswordRecoveryCallback,
  redirectToVerifyEmailCallback,
} from '../../../../shared/utils/email-verification.util';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, IconComponent, NgOptimizedImage, GoogleSignInButton, PasskeySignInButtonComponent],
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
  protected readonly googleSignInEnabled = !!environment.googleClientId;

  /** The sign-in currently running. Only one may run at a time. */
  protected readonly activeMethod = signal<'password' | 'google' | 'passkey' | null>(null);
  /** The latest sign-in error, kept on the page as well as in a toast. */
  protected readonly inlineError = signal<string | null>(null);

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

  /** Disables every sign-in option while any of them is in progress. */
  protected readonly isBusy = computed(() => this.activeMethod() !== null || this.selectSignal.isLoginLoading());

  constructor() {
    super();

    let lastErrorNotified: string | null = null;

    effect(() => {
      const errorMsg = this.selectSignal.errorMessage();

      if (errorMsg && errorMsg !== lastErrorNotified) {
        lastErrorNotified = errorMsg;
        this.inlineError.set(errorMsg);
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
    if (!preSubmissionValidation(this.loginForm, this.isBusy())) {
      return;
    }

    this.startAttempt('password');
    try {
      const { email, password } = this.loginForm.getRawValue();

      await firstValueFrom(
        this.store.dispatch(new AuthActions.Login({ email, password }))
      );

      await navigateAfterLogin(this.store, this.router);
    } catch {
      // Error is already reflected in the errorMessage signal via state
    } finally {
      this.activeMethod.set(null);
    }
  }

  protected async onGoogleCredential(credential: GoogleCredential): Promise<void> {
    if (this.isBusy()) {
      return;
    }

    this.startAttempt('google');
    try {
      await firstValueFrom(this.store.dispatch(new AuthActions.LoginWithGoogle(credential)));
      await continueAfterGoogle(this.store, this.router, this.toastService);
    } catch {
      // Error is already reflected in the errorMessage signal via state
    } finally {
      this.activeMethod.set(null);
    }
  }

  protected onPasskeyBusy(busy: boolean): void {
    if (busy) {
      this.startAttempt('passkey');
    } else if (this.activeMethod() === 'passkey') {
      this.activeMethod.set(null);
    }
  }

  protected onPasskeyFailed(message: string): void {
    this.inlineError.set(message);
  }

  private startAttempt(method: 'password' | 'google' | 'passkey'): void {
    this.inlineError.set(null);
    this.activeMethod.set(method);
  }

  protected navigateToRegister(): void {
    this.store.dispatch(new AuthActions.ClearAuthMessages());
    this.router.navigate([APP_ROUTES.REGISTER]);
  }

  protected navigateToForgotPassword(): void {
  this.store.dispatch(new AuthActions.ClearAuthMessages());
  this.router.navigate([APP_ROUTES.FORGOT_PASSWORD]);
  }

  private redirectEmailVerificationCallbackIfPresent(): void {
    if (hasPasswordRecoveryCallbackHash()) {
      redirectToPasswordRecoveryCallback();
      return;
    }

    if (hasEmailVerificationCallbackHash()) {
      redirectToVerifyEmailCallback();
    }
  }
}
