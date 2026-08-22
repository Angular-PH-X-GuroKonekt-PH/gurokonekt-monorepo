import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProfileService } from '../../profile.service';
import * as AuthActions from '../../../auth/store/auth.actions';

@Component({
  selector: 'app-account-deactivation-page',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './account-deactivation.page.html',
  host: { class: 'block' },
})
export class AccountDeactivationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);
  private readonly toastService = inject(ToastService);

  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly isTokenValid = signal(false);
  protected readonly isComplete = signal(false);
  protected readonly errorMessage = signal('');

  private deactivationToken = '';
  private userId = '';

  ngOnInit(): void {
    this.deactivationToken = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

    if (!this.deactivationToken) {
      this.fail('This deactivation link is missing or invalid.');
      return;
    }

    this.verifyToken();
  }

  protected async submitReason(reason: string): Promise<void> {
    const trimmedReason = reason.trim();

    if (!trimmedReason || !this.userId || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const response = await firstValueFrom(
        this.profileService.submitDeactivationFeedback(this.userId, {
          token: this.deactivationToken,
          reason: trimmedReason,
        }),
      );

      this.store.dispatch(new AuthActions.ResetAuthState());
      this.isComplete.set(true);
      this.toastService.success(
        response.message || 'Your account has been deactivated.',
        'Account deactivated',
      );
    } catch (error: unknown) {
      this.errorMessage.set(this.getErrorMessage(error, 'Unable to deactivate your account. Please try again.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected goToLogin(): void {
    void this.router.navigate([`/${APP_ROUTES.LOGIN}`], { replaceUrl: true });
  }

  private verifyToken(): void {
    this.profileService.verifyDeactivationToken(this.deactivationToken).subscribe({
      next: (response) => {
        const userId = response.data?.userId;

        if (!userId) {
          this.fail('This deactivation link is invalid or has expired.');
          return;
        }

        this.userId = userId;
        this.isTokenValid.set(true);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.fail(this.getErrorMessage(error, 'This deactivation link is invalid or has expired.'));
      },
    });
  }

  private fail(message: string): void {
    this.errorMessage.set(message);
    this.isLoading.set(false);
    this.isTokenValid.set(false);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = String(error.message).trim();
      if (message) {
        return message;
      }
    }

    return fallback;
  }
}
