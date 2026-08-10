import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { APP_ROUTES } from '../../../../../shared/constants/routes';
import { resolveVerificationRecipientEmail } from '../../../../../shared/utils/email-verification.util';
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
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly authStorage = inject(AuthStorageService);

  protected readonly message = this.store.selectSignal(VerifyEmailState.message);
  protected readonly resendError = this.store.selectSignal(VerifyEmailState.resendError);
  protected readonly isResendLoading = this.store.selectSignal(
    VerifyEmailState.isResendLoading
  );
  protected readonly email = this.store.selectSignal(VerifyEmailState.email);

  /** Manual entry when redirect/storage did not carry the recipient email. */
  protected readonly emailInput = signal('');

  protected readonly needsEmailInput = computed(() => !this.email()?.trim());

  protected readonly canResend = computed(() => {
    const known = this.email()?.trim();
    if (known) {
      return true;
    }
    return this.isValidEmail(this.emailInput());
  });

  ngOnInit(): void {
    if (this.email()?.trim()) {
      return;
    }

    const fallbackEmail = resolveVerificationRecipientEmail(
      this.route.snapshot.queryParamMap.get('email'),
      this.store.selectSnapshot(AuthSelectors.lastRegisteredEmail),
      this.authStorage.getLastRegisteredEmail()
    );

    if (fallbackEmail) {
      this.authStorage.setLastRegisteredEmail(fallbackEmail);
      this.store.dispatch(
        new InitializeVerification({ email: fallbackEmail, role: '', message: '' })
      );
    }
  }

  protected onEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emailInput.set(value);
  }

  protected navigateToLogin(): void {
    void this.router.navigate([APP_ROUTES.LOGIN]);
  }

  protected resendVerification(): void {
    const email = resolveVerificationRecipientEmail(this.email(), this.emailInput());
    if (!this.isValidEmail(email)) {
      return;
    }

    this.store.dispatch(new ResendVerificationEmail(email));
  }

  private isValidEmail(value: string): boolean {
    const email = value.trim();
    return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
