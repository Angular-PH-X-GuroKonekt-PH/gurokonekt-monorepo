import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { ToastService } from '../../../../shared/services/toast.service';
import { PasskeyService } from '../../services/passkey.service';
import { LoginSuccess } from '../../store/auth.actions';
import { navigateAfterLogin } from '../../helpers/post-login-navigation.helper';

/**
 * "Sign in with a passkey" on the login page, styled like Google's sign-in
 * button so the options read as one set. No email is needed: the browser
 * shows the passkeys saved for GuroKonekt and the person picks one. A
 * successful sign-in goes through the same LoginSuccess as password login.
 */
@Component({
  selector: 'app-passkey-sign-in-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isSupported) {
      <button type="button" class="auth-provider-button" (click)="signIn()" [disabled]="disabled() || isSigningIn()">
        @if (isSigningIn()) {
          <span
            class="auth-provider-button__icon animate-spin rounded-full border-2 border-orange-500 border-t-transparent"
            aria-hidden="true"
          ></span>
          Waiting for your passkey...
        } @else {
          <!-- Passkey mark: a person with a key -->
          <svg class="auth-provider-button__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="9" cy="7" r="4" stroke="#3c4043" stroke-width="2" />
            <path d="M2 21v-1.5A5.5 5.5 0 0 1 7.5 14h3" stroke="#3c4043" stroke-width="2" stroke-linecap="round" />
            <circle cx="17" cy="14.5" r="2.5" stroke="#f97316" stroke-width="2" />
            <path d="M17 17v4m0-1.5h1.75" stroke="#f97316" stroke-width="2" stroke-linecap="round" />
          </svg>
          Sign in with a passkey
        }
      </button>
    } @else {
      <p class="text-center text-sm text-gray-500" role="status">
        Passkey sign-in isn't supported on this browser or device.
      </p>
    }
  `,
})
export class PasskeySignInButtonComponent {
  private readonly passkeyService = inject(PasskeyService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  /** Set while another sign-in (password or Google) is running. */
  readonly disabled = input(false);
  /** True from the moment the passkey prompt opens until sign-in finishes. */
  readonly busy = output<boolean>();
  /** A sign-in failure, for the page to show alongside its other errors. */
  readonly failed = output<string>();

  protected readonly isSupported = this.passkeyService.isSupported();
  protected readonly isSigningIn = signal(false);

  protected async signIn(): Promise<void> {
    if (this.isSigningIn() || this.disabled()) {
      return;
    }

    this.setBusy(true);
    try {
      const result = await this.passkeyService.signIn();
      switch (result.status) {
        case 'signed-in':
          await firstValueFrom(
            this.store.dispatch(
              new LoginSuccess({
                user: result.user,
                token: result.token,
                refreshToken: result.refreshToken,
                message: result.message,
              })
            )
          );
          await navigateAfterLogin(this.store, this.router);
          break;
        case 'cancelled':
          this.toastService.info('You can try again or sign in another way.', 'Passkey sign-in cancelled');
          break;
        case 'failed':
          this.failed.emit(result.message);
          this.toastService.errorExclusive(result.message, 'Login Failed');
          break;
      }
    } finally {
      this.setBusy(false);
    }
  }

  private setBusy(busy: boolean): void {
    this.isSigningIn.set(busy);
    this.busy.emit(busy);
  }
}
