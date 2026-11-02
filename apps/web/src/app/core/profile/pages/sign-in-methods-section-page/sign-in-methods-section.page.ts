import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import type { SignInMethodsInterface } from '@gurokonekt/models/interfaces/sign-in-methods/sign-in-methods.model';

import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { rememberPostLoginRedirect } from '../../../../shared/utils/post-login-redirect.util';
import { Logout } from '../../../auth/store/auth.actions';
import {
  GoogleCredential,
  GoogleSignInButton,
} from '../../../auth/components/google-sign-in-button/google-sign-in-button.component';
import { SignInMethodChangeResult, SignInMethodsService } from '../../../auth/services/sign-in-methods.service';

/**
 * Settings > Sign-in methods: password, Google and passkeys in one place.
 * Google is connected here, while signed in, rather than automatically by a
 * matching email at login. Changes need a recent sign-in; when it's too old
 * the page offers to sign in again and comes back here afterwards.
 */
@Component({
  selector: 'app-sign-in-methods-section-page',
  imports: [IconComponent, RouterLink, GoogleSignInButton],
  templateUrl: './sign-in-methods-section.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInMethodsSectionPage implements OnInit {
  private readonly signInMethodsService = inject(SignInMethodsService);
  private readonly toastService = inject(ToastService);
  private readonly store = inject(Store);

  protected readonly googleAvailable = !!environment.googleClientId;
  protected readonly passkeysRoute = `/${APP_ROUTES.SETTINGS_PASSKEYS}`;
  protected readonly methods = signal<SignInMethodsInterface | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly isBusy = signal(false);
  protected readonly confirmingDisconnect = signal(false);
  protected readonly reauthMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    try {
      this.methods.set(await this.signInMethodsService.list());
    } catch {
      this.loadFailed.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async connectGoogle(credential: GoogleCredential): Promise<void> {
    if (this.isBusy()) return;
    this.isBusy.set(true);
    this.apply(await this.signInMethodsService.connectGoogle(credential), 'Google connected', "Couldn't connect Google");
    this.isBusy.set(false);
  }

  protected async disconnectGoogle(): Promise<void> {
    if (this.isBusy()) return;
    this.isBusy.set(true);
    this.confirmingDisconnect.set(false);
    this.apply(await this.signInMethodsService.disconnectGoogle(), 'Google disconnected', "Couldn't disconnect Google");
    this.isBusy.set(false);
  }

  /** Signs out and comes back here after the next sign-in. */
  protected signInAgain(): void {
    rememberPostLoginRedirect(`/${APP_ROUTES.SETTINGS_SIGN_IN_METHODS}`);
    this.toastService.info('Sign in again, then you can change how you sign in.', 'Confirm it’s you');
    this.store.dispatch(new Logout());
  }

  private apply(result: SignInMethodChangeResult, successTitle: string, failureTitle: string): void {
    switch (result.status) {
      case 'done':
        this.methods.set(result.methods);
        this.reauthMessage.set(null);
        this.toastService.success(result.message, successTitle);
        break;
      case 'reauth-required':
        this.reauthMessage.set(result.message);
        break;
      case 'failed':
        this.toastService.error(result.message, failureTitle);
        break;
    }
  }
}
