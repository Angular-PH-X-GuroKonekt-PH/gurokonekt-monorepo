import { ChangeDetectionStrategy, Component, inject, signal, output } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { Role } from '@gurokonekt/models/interfaces/auth/user.types';
import { IconComponent } from 'apps/web/src/app/shared/components/icon/icon.component';
import { ToastService } from 'apps/web/src/app/shared/services/toast.service';
import { environment } from '../../../../../../environments/environment';
import {
  GoogleCredential,
  GoogleSignInButton,
} from '../../../components/google-sign-in-button/google-sign-in-button.component';
import { continueAfterGoogle } from '../../../helpers/post-login-navigation.helper';
import { LoginWithGoogle } from '../../../store/auth.actions';
import { AuthSelectors } from '../../../store/auth.selectors';
import { ClearGoogleRegistration } from '../../../store/registration.actions';
import { RegistrationSelectors } from '../../../store/registration.selectors';

@Component({
  selector: 'app-registration-role-selection-page',
  standalone: true,
  imports: [IconComponent, GoogleSignInButton],
  templateUrl: './registration-role-selection.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationRoleSelectionPage {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly selectedRole = signal<Role | null>(null);
  readonly roleSelected = output<'mentee' | 'mentor'>();

  protected readonly googleSignInEnabled = !!environment.googleClientId;
  protected readonly googleRegistration = this.store.selectSignal(RegistrationSelectors.googleRegistration);
  protected readonly isGoogleLoading = this.store.selectSignal(AuthSelectors.isLoginLoading);

  protected selectRole(role: Role): void {
    this.selectedRole.set(role);
  }

  protected continue(): void {
    const role = this.selectedRole();
    if (!role) {
      return;
    }

    this.roleSelected.emit(role);
  }

  /**
   * Sign up with Google. A Google account that already has a GuroKonekt
   * account is simply signed in, so no duplicate is created; a new one stays
   * here to pick a role with the Google details carried into the form.
   */
  protected async onGoogleCredential(credential: GoogleCredential): Promise<void> {
    if (this.isGoogleLoading()) {
      return;
    }

    try {
      await firstValueFrom(this.store.dispatch(new LoginWithGoogle(credential)));
      if (!this.store.selectSnapshot(RegistrationSelectors.googleRegistration)) {
        this.toastService.success('You already have a GuroKonekt account, so we signed you in.', 'Welcome back!');
      }
      await continueAfterGoogle(this.store, this.router, this.toastService);
    } catch {
      const message = this.store.selectSnapshot(AuthSelectors.errorMessage);
      this.toastService.errorExclusive(message || 'Google sign-up failed. Please try again.', 'Sign-up Failed');
    }
  }

  protected useDifferentMethod(): void {
    this.store.dispatch(new ClearGoogleRegistration());
  }
}
