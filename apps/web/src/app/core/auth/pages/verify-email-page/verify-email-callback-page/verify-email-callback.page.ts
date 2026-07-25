import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { APP_ROUTES } from '../../../../../shared/constants/routes';
import {
  getEmailVerificationParams,
  getVerificationEmailFromCallback,
  hasPasswordRecoveryCallbackHash,
  redirectToPasswordRecoveryCallback,
  resolveEmailVerificationOutcome,
} from '../../../../../shared/utils/email-verification.util';
import { AuthStorageService } from '../../../../storage/auth-storage.service';
import { AuthSelectors } from '../../../store/auth.selectors';
import { InitializeVerification } from '../../../store/verify-email.actions';

@Component({
  selector: 'app-verify-email-callback-page',
  standalone: true,
  template: `
    <section
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50"
      aria-busy="true"
      aria-label="Processing email verification"
    >
      <p class="text-sm text-gray-600">Verifying your email…</p>
    </section>
  `,
})
export class VerifyEmailCallbackPage implements OnInit {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly authStorage = inject(AuthStorageService);

  ngOnInit(): void {
    if (hasPasswordRecoveryCallbackHash()) {
      redirectToPasswordRecoveryCallback();
      return;
    }

    const params = getEmailVerificationParams();
    const outcome = resolveEmailVerificationOutcome(params);

    const destinationByOutcome: Record<
      NonNullable<ReturnType<typeof resolveEmailVerificationOutcome>>,
      string
    > = {
      success: APP_ROUTES.VERIFY_EMAIL_SUCCESS,
      expired: APP_ROUTES.VERIFY_EMAIL_EXPIRED,
      'already-verified': APP_ROUTES.VERIFY_EMAIL_ALREADY_VERIFIED,
    };

    if (outcome) {
      if (outcome === 'expired') {
        const email =
          getVerificationEmailFromCallback() ||
          this.store.selectSnapshot(AuthSelectors.lastRegisteredEmail) ||
          this.authStorage.getLastRegisteredEmail() ||
          '';

        if (email) {
          this.authStorage.setLastRegisteredEmail(email);
          this.store.dispatch(
            new InitializeVerification({ email, role: '', message: '' })
          );
        }
      }

      void this.router.navigate([destinationByOutcome[outcome]], { replaceUrl: true });
      return;
    }

    void this.router.navigate([APP_ROUTES.LOGIN], { replaceUrl: true });
  }
}
