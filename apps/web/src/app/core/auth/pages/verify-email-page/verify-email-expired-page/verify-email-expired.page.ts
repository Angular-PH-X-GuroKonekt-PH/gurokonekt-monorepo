import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { APP_ROUTES } from '../../../../../shared/constants/routes';
import { VerifyEmailState } from '../../../store/verify-email.state';
import { ResendVerificationEmail } from '../../../store/verify-email.actions';
import { EmailVerificationResultLayoutComponent } from '../email-verification-result-layout/email-verification-result-layout.component';

@Component({
  selector: 'app-verify-email-expired-page',
  standalone: true,
  imports: [EmailVerificationResultLayoutComponent, IconComponent],
  templateUrl: './verify-email-expired.page.html',
})
export class VerifyEmailExpiredPage {
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly message = this.store.selectSignal(VerifyEmailState.message);
  protected readonly resendError = this.store.selectSignal(VerifyEmailState.resendError);
  protected readonly isResendLoading = this.store.selectSignal(
    VerifyEmailState.isResendLoading
  );
  protected readonly email = this.store.selectSignal(VerifyEmailState.email);

  protected navigateToLogin(): void {
    void this.router.navigate([APP_ROUTES.LOGIN]);
  }

  protected navigateToRegister(): void {
    void this.router.navigate([APP_ROUTES.REGISTER]);
  }

  protected resendVerification(): void {
    if (!this.email()) {
      void this.router.navigate([APP_ROUTES.REGISTER]);
      return;
    }

    this.store.dispatch(new ResendVerificationEmail());
  }
}
