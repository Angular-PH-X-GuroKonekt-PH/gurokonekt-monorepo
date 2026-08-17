import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import { APP_ROUTES } from '../../../../shared/constants/routes';

const INVALID_LINK_MESSAGE = 'This password reset link is invalid or has expired.';

/**
 * Landing page for the recovery link emailed by Supabase. The recovery token
 * arrives in the URL fragment, so it is captured on construction and wiped
 * from the address bar before anything else can read it.
 */
@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.page.html',
})
export class ResetPasswordPage {
  private readonly passwordReset = inject(PasswordResetService);
  private readonly router = inject(Router);

  protected readonly loginRoute = `/${APP_ROUTES.LOGIN}`;
  protected readonly forgotPasswordRoute = `/${APP_ROUTES.FORGOT_PASSWORD}`;

  private accessToken = '';

  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  linkError = '';
  isLoading = false;

  constructor() {
    this.captureRecoveryToken();
  }

  onSubmit(): void {
    if (!this.accessToken || !this.newPassword) return;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.passwordReset
      .completeReset({ accessToken: this.accessToken, newPassword: this.newPassword })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate([APP_ROUTES.LOGIN]);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message;
        },
      });
  }

  /**
   * Supabase returns the recovery token in the URL fragment (and, depending on
   * the flow, the query string). Read whichever is present, then clear it so
   * the token does not linger in history or referrers.
   */
  private captureRecoveryToken(): void {
    if (typeof window === 'undefined') {
      this.linkError = INVALID_LINK_MESSAGE;
      return;
    }

    // Prefer the fragment, fall back to the query string. Compared as raw
    // strings rather than via URLSearchParams.size, which is absent in some
    // environments and silently makes every callback look empty.
    const fragment = window.location.hash.slice(1);
    const params = new URLSearchParams(fragment || window.location.search.slice(1));

    const errorDescription = params.get('error_description');
    const token = params.get('access_token');
    const type = params.get('type');

    if (errorDescription) {
      this.linkError = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
      return;
    }

    if (!token || type !== 'recovery') {
      this.linkError = INVALID_LINK_MESSAGE;
      return;
    }

    this.accessToken = token;
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
