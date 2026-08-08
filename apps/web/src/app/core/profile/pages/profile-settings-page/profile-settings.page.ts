import {
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { APP_ROUTES } from '../../../../shared/constants/routes';
import {
  IconComponent,
  type IconName,
} from '../../../../shared/components/icon/icon.component';
import { AuthSelectors } from '../../../auth/store/auth.selectors';
import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';

interface SettingsNavItem {
  route: string;
  label: string;
  description: string;
  icon: IconName;
}

@Component({
  selector: 'app-profile-settings-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  templateUrl: './profile-settings.page.html',
  host: { class: 'block' },
})
export class ProfileSettingsPage {
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  private readonly user = this.store.selectSignal(AuthSelectors.user);

  protected readonly dashboardRoute = `/${APP_ROUTES.DASHBOARD}`;
  protected readonly isChangePasswordOpen = signal(false);
  protected readonly isSendingResetLink = signal(false);
  protected readonly accountEmail = computed(
    () => this.user()?.email?.trim() ?? '',
  );

  protected readonly sections: SettingsNavItem[] = [
    {
      route: `/${APP_ROUTES.SETTINGS_OVERVIEW}`,
      label: 'Overview',
      description: 'Account identity',
      icon: 'user',
    },
    {
      route: `/${APP_ROUTES.SETTINGS_EDIT}`,
      label: 'Edit Profile',
      description: 'Details & picture',
      icon: 'pencil-square',
    },
  ];

  protected openChangePasswordModal(): void {
    if (!this.accountEmail()) {
      this.toastService.error(
        'Your account email is unavailable. Please refresh the page and try again.',
        'Unable to change password',
      );
      return;
    }

    this.isChangePasswordOpen.set(true);
  }

  protected closeChangePasswordModal(): void {
    if (!this.isSendingResetLink()) {
      this.isChangePasswordOpen.set(false);
    }
  }

  protected async sendPasswordResetLink(): Promise<void> {
    const email = this.accountEmail();

    if (!email || this.isSendingResetLink()) {
      return;
    }

    this.isSendingResetLink.set(true);

    try {
      const response = await firstValueFrom(
        this.authService.forgotPassword(email),
      );

      this.toastService.success(
        response.message ||
          'A secure password reset link has been sent to your email.',
        'Check your email',
      );
      this.isChangePasswordOpen.set(false);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Unable to send the password reset link. Please try again.';

      this.toastService.error(message, 'Unable to send reset link');
    } finally {
      this.isSendingResetLink.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected handleEscapeKey(): void {
    if (this.isChangePasswordOpen()) {
      this.closeChangePasswordModal();
    }
  }
}
