import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { AuthUser } from '@gurokonekt/models/interfaces/auth/auth-user.interface';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { AuthSelectors } from '../../../auth/store/auth.selectors';
import * as AuthActions from '../../../auth/store/auth.actions';
import { ProfileService } from '../../profile.service';

interface ActivationProfile {
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-account-activation-page',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './account-activation.page.html',
})
export class AccountActivationPage implements OnInit {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);

  protected readonly isLoading = signal(true);
  protected readonly isActivating = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly activationRequestSubmitted = signal(false);
  protected readonly activationReason = signal('');
  protected readonly profile = signal<ActivationProfile | null>(null);

  protected readonly isMentor = computed(() => this.profile()?.role.toLowerCase() === 'mentor');
  protected readonly initials = computed(() => {
    const name = this.profile()?.fullName.trim() ?? '';
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'GK'
    );
  });

  async ngOnInit(): Promise<void> {
    const user = this.store.selectSnapshot(AuthSelectors.user);

    if (!user) {
      await this.goToLogin();
      return;
    }

    this.profile.set(this.toActivationProfile(user));

    try {
      const response = await firstValueFrom(this.profileService.getUserProfile(user.id));
      if (response.data && typeof response.data === 'object') {
        this.profile.set(this.toActivationProfile(response.data as Record<string, unknown>));
      }
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'Unable to load your account details.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async activateAccount(): Promise<void> {
    const user = this.store.selectSnapshot(AuthSelectors.user);
    const reason = this.activationReason().trim();

    if (!user || !reason || this.isActivating()) {
      this.errorMessage.set('Please provide a reason before continuing.');
      return;
    }

    this.errorMessage.set(null);
    this.isActivating.set(true);

    try {
      const response = await firstValueFrom(this.profileService.activateAccount(user.id, reason));

      if (response.data?.activationStatus === 'approved') {
        this.store.dispatch(new AuthActions.UpdateCurrentUserStatus('active'));
        await this.router.navigate([APP_ROUTES.DASHBOARD]);
      } else {
        this.activationRequestSubmitted.set(true);
      }
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error, 'Unable to process your activation request.'));
    } finally {
      this.isActivating.set(false);
    }
  }

  protected async goToLogin(): Promise<void> {
    this.store.dispatch(new AuthActions.ResetAuthState());
    await this.router.navigate([APP_ROUTES.LOGIN], { replaceUrl: true });
  }

  private toActivationProfile(source: AuthUser | Record<string, unknown>): ActivationProfile {
    const profileSource = source as Record<string, unknown>;
    const firstName = this.getString(profileSource['firstName']);
    const lastName = this.getString(profileSource['lastName']);
    const fullName =
      `${firstName} ${lastName}`.trim() || this.getString(profileSource['fullName']) || 'GuroKonekt member';
    const avatarAttachments = profileSource['avatarAttachments'];
    const avatarUrl = Array.isArray(avatarAttachments)
      ? this.getString((avatarAttachments[0] as Record<string, unknown> | undefined)?.['publicUrl'])
      : '';

    return {
      fullName,
      email: this.getString(profileSource['email']),
      role: this.getString(profileSource['role']) || 'mentee',
      avatarUrl,
    };
  }

  private getString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return fallback;
  }
}
