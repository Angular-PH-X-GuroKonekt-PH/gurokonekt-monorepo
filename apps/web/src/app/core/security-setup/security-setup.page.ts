import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/services/toast.service';
import { Logout } from '../auth/store/auth.actions';
import { navigateAfterLogin } from '../auth/helpers/post-login-navigation.helper';
import { describeThisDevice, PasskeyService } from '../auth/services/passkey.service';
import { SignInMethodsService } from '../auth/services/sign-in-methods.service';
import {
  GoogleCredential,
  GoogleSignInButton,
} from '../auth/components/google-sign-in-button/google-sign-in-button.component';
import { SecuritySetupService } from './security-setup.service';

type Step = 'password' | 'passkey' | 'google';

/**
 * Where signed-in users land while their account is missing a sign-in method
 * the platform requires (#463). It can't be skipped: the API answers every
 * other request with 403 until the list here is complete.
 */
@Component({
  selector: 'app-security-setup-page',
  imports: [GoogleSignInButton],
  templateUrl: './security-setup.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecuritySetupPage implements OnInit {
  private readonly setup = inject(SecuritySetupService);
  private readonly passkeys = inject(PasskeyService);
  private readonly signInMethods = inject(SignInMethodsService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly status = this.setup.status;
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly busy = signal<Step | null>(null);
  protected readonly reauthMessage = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly googleAvailable = !!environment.googleClientId;
  protected readonly passkeysSupported = this.passkeys.isSupported();
  protected readonly completed = computed(() => !!this.status()?.requirementsCompleted);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    try {
      await this.setup.refresh();
    } catch {
      this.loadFailed.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async setPassword(): Promise<void> {
    if (this.busy()) return;
    // Strength rules are checked by the API, which returns the message to show.
    const password = this.newPassword();
    if (password !== this.confirmPassword()) {
      this.passwordError.set('Passwords do not match.');
      return;
    }

    this.passwordError.set(null);
    this.busy.set('password');
    const result = await this.setup.setPassword(password, this.confirmPassword());
    this.busy.set(null);
    switch (result.status) {
      case 'done':
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.toast.success(result.message, 'Password set');
        break;
      case 'reauth-required':
        this.reauthMessage.set(result.message);
        break;
      case 'failed':
        this.passwordError.set(result.message);
        break;
    }
  }

  protected async addPasskey(): Promise<void> {
    if (this.busy()) return;
    this.busy.set('passkey');
    const result = await this.passkeys.register(describeThisDevice());
    this.busy.set(null);
    if (result.status === 'added') {
      this.toast.success(result.message, 'Passkey added');
      await this.load();
    } else if (result.status === 'failed') {
      this.toast.error(result.message, "Couldn't add passkey");
    }
  }

  protected async connectGoogle(credential: GoogleCredential): Promise<void> {
    if (this.busy()) return;
    this.busy.set('google');
    const result = await this.signInMethods.connectGoogle(credential);
    this.busy.set(null);
    switch (result.status) {
      case 'done':
        this.reauthMessage.set(null);
        this.toast.success(result.message, 'Google connected');
        await this.load();
        break;
      case 'reauth-required':
        this.reauthMessage.set(result.message);
        break;
      case 'failed':
        this.toast.error(result.message, "Couldn't connect Google");
        break;
    }
  }

  protected async continue(): Promise<void> {
    if (this.completed()) await navigateAfterLogin(this.store, this.router);
  }

  /** After signing in again, the setup guard brings the user straight back here. */
  protected signOut(): void {
    this.store.dispatch(new Logout());
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
