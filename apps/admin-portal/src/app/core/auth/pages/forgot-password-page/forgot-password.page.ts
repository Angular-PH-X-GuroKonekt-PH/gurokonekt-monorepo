import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import { APP_ROUTES } from '../../../../shared/constants/routes';

/**
 * Step one of admin password recovery: ask for the email, then hand off to
 * the emailed link. Also the documented way back in after a sign-in lockout,
 * since completing a reset clears the failed-attempt counter server-side.
 */
@Component({
  selector: 'app-forgot-password-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
})
export class ForgotPasswordPage {
  private readonly passwordReset = inject(PasswordResetService);

  protected readonly loginRoute = `/${APP_ROUTES.LOGIN}`;

  email = '';
  errorMessage = '';
  isSent = false;
  isLoading = false;

  onSubmit(): void {
    const email = this.email.trim();
    if (!email) return;

    this.errorMessage = '';
    this.isLoading = true;

    this.passwordReset.requestReset(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSent = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message;
      },
    });
  }
}
