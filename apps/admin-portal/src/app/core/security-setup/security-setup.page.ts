import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { environment } from '../../../environments/environment';
import { APP_ROUTES } from '../../shared/constants/routes';
import { ToastService } from '../../shared/services/toast.service';
import {
  GoogleCredential,
  GoogleSignInButton,
} from '../../shared/components/google-sign-in-button/google-sign-in-button.component';
import * as AuthActions from '../auth/store/auth.actions';
import { SecuritySetupService, SetupStepResult } from './security-setup.service';

/**
 * The page admins land on while their account is missing a sign-in method
 * the platform requires (#463). It can't be skipped: the API answers every
 * other admin request with 403 until the list here is complete.
 */
@Component({
  selector: 'app-security-setup-page',
  imports: [GoogleSignInButton],
  templateUrl: './security-setup.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecuritySetupPage implements OnInit {
  private readonly setup = inject(SecuritySetupService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly toast = inject(ToastService);

  protected readonly status = this.setup.status;
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly busy = signal<'passkey' | 'google' | null>(null);
  protected readonly reauthMessage = signal<string | null>(null);
  protected readonly googleAvailable = !!environment.googleClientId;
  protected readonly passkeysSupported = this.setup.passkeysSupported();
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

  protected async addPasskey(): Promise<void> {
    if (this.busy()) return;
    this.busy.set('passkey');
    await this.apply(await this.setup.addPasskey(), 'Passkey added');
    this.busy.set(null);
  }

  protected async connectGoogle(credential: GoogleCredential): Promise<void> {
    if (this.busy()) return;
    this.busy.set('google');
    await this.apply(await this.setup.connectGoogle(credential), 'Google connected');
    this.busy.set(null);
  }

  protected continue(): void {
    if (this.completed()) void this.router.navigate([APP_ROUTES.DASHBOARD]);
  }

  protected signOut(): void {
    this.store.dispatch(new AuthActions.Logout());
  }

  private async apply(result: SetupStepResult, successTitle: string): Promise<void> {
    switch (result.status) {
      case 'done':
        this.reauthMessage.set(null);
        this.toast.success('Your account is updated.', successTitle);
        await this.load();
        break;
      case 'reauth-required':
        this.reauthMessage.set(result.message);
        break;
      case 'failed':
        this.toast.error(result.message);
        break;
      case 'cancelled':
        break;
    }
  }
}
