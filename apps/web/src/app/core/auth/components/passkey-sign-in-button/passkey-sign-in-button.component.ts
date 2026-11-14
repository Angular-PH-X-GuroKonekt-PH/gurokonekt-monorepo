import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { requiresProfileSetup } from '../../../../shared/utils/profile-completion.util';
import { PasskeyService } from '../../services/passkey.service';
import { AuthSelectors } from '../../store/auth.selectors';
import { LoginSuccess } from '../../store/auth.actions';

/**
 * "Sign in with a passkey" on the login page. No email is needed: the browser
 * shows the passkeys saved for GuroKonekt and the person picks one. A
 * successful sign-in goes through the same LoginSuccess as password login.
 */
@Component({
  selector: 'app-passkey-sign-in-button',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isSupported) {
      <button
        type="button"
        (click)="signIn()"
        [disabled]="disabled() || isSigningIn()"
        class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-orange-300 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        @if (isSigningIn()) {
          <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></span>
          Waiting for your passkey...
        } @else {
          <app-icon name="locked-closed" class="h-5 w-5 text-orange-500"></app-icon>
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

  /** Set while another sign-in (e.g. password) is running. */
  readonly disabled = input(false);

  protected readonly isSupported = this.passkeyService.isSupported();
  protected readonly isSigningIn = signal(false);

  protected async signIn(): Promise<void> {
    if (this.isSigningIn() || this.disabled()) {
      return;
    }

    this.isSigningIn.set(true);
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
          await this.navigateAfterSignIn();
          break;
        case 'cancelled':
          this.toastService.info('You can try again or sign in another way.', 'Passkey sign-in cancelled');
          break;
        case 'failed':
          this.toastService.errorExclusive(result.message, 'Login Failed');
          break;
      }
    } finally {
      this.isSigningIn.set(false);
    }
  }

  /** Same destinations as password login. */
  private async navigateAfterSignIn(): Promise<void> {
    const user = this.store.selectSnapshot(AuthSelectors.user);
    if (!user) {
      return;
    }
    if (user.status === 'inactive') {
      await this.router.navigate([`/${APP_ROUTES.ACTIVATE_ACCOUNT}`]);
      return;
    }
    if (requiresProfileSetup(user.role, user.isProfileComplete, user.isMentorProfileComplete)) {
      await this.router.navigate([APP_ROUTES.PROFILE_SETUP]);
      return;
    }
    await this.router.navigate([APP_ROUTES.DASHBOARD]);
  }
}
