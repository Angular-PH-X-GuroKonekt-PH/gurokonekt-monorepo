import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { APP_ROUTES } from '../../../../../shared/constants/routes';
import { AuthStorageService } from '../../../../storage/auth-storage.service';
import { AuthSelectors } from '../../../store/auth.selectors';
import { VerifyEmailState } from '../../../store/verify-email.state';
import {
  InitializeVerification,
  ResendVerificationEmail,
} from '../../../store/verify-email.actions';
import { EmailVerificationResultLayoutComponent } from '../email-verification-result-layout/email-verification-result-layout.component';

@Component({
  selector: 'app-verify-email-expired-page',
  standalone: true,
  imports: [EmailVerificationResultLayoutComponent, IconComponent],
  templateUrl: './verify-email-expired.page.html',
})
export class VerifyEmailExpiredPage implements OnInit {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly authStorage = inject(AuthStorageService);

  protected readonly message = this.store.selectSignal(VerifyEmailState.message);
  protected readonly resendError = this.store.selectSignal(VerifyEmailState.resendError);
  protected readonly isResendLoading = this.store.selectSignal(
    VerifyEmailState.isResendLoading
  );
  protected readonly email = this.store.selectSignal(VerifyEmailState.email);

  ngOnInit(): void {
    if (!this.email()) {
      const fallbackEmail =
        this.store.selectSnapshot(AuthSelectors.lastRegisteredEmail) ||
        this.authStorage.getLastRegisteredEmail() ||
        '';

      if (fallbackEmail) {
        this.store.dispatch(
          new InitializeVerification({ email: fallbackEmail, role: '', message: '' })
        );
      }
    }
  }

  protected navigateToLogin(): void {
    void this.router.navigate([APP_ROUTES.LOGIN]);
  }

  protected resendVerification(): void {
    this.store.dispatch(new ResendVerificationEmail(this.email() || undefined));
  }
}
