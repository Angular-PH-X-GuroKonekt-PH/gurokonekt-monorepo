import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { catchError, firstValueFrom, map, of, switchMap, take } from 'rxjs';
import { haveSameTimezoneOffset, isValidTimezone } from '@gurokonekt/utils';

import { AuthSelectors } from '../../core/auth/store/auth.selectors';
import { ProfileService } from '../../core/profile/profile.service';

@Injectable({ providedIn: 'root' })
export class UserTimezoneService {
  private readonly store = inject(Store, { optional: true });
  private readonly profileService = inject(ProfileService);
  private readonly user =
    this.store?.selectSignal(AuthSelectors.user) ?? signal(null);
  private readonly profileTimezone = toSignal(
    toObservable(this.user).pipe(
      switchMap((user) =>
        user?.role === 'mentee' || user?.role === 'mentor'
          ? this.profileService.getUserProfile(user.id).pipe(
              map((response) => {
                const timezone = (response.data as { timezone?: unknown } | null)
                  ?.timezone;
                return typeof timezone === 'string' && isValidTimezone(timezone)
                  ? timezone
                  : null;
              }),
              catchError(() => of(null)),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  private readonly dismissedPromptKey = signal<string | null>(null);
  private readonly deviceTimezoneOverride = signal<{
    userId: string;
    timezone: string;
  } | null>(null);

  readonly browserTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  readonly displayTimezone = computed(() => {
    const userId = this.user()?.id;
    const override = this.deviceTimezoneOverride();

    return (override?.userId === userId ? override?.timezone : null) ??
      this.profileTimezone() ??
      this.browserTimezone;
  });

  readonly timezoneMismatch = computed(() => {
    const profileTimezone = this.profileTimezone();

    return (
      !!profileTimezone &&
      isValidTimezone(this.browserTimezone) &&
      !haveSameTimezoneOffset(profileTimezone, this.browserTimezone)
    );
  });

  readonly shouldPrompt = computed(() => {
    const userId = this.user()?.id;
    const profileTimezone = this.profileTimezone();

    if (!userId || !profileTimezone || !this.timezoneMismatch()) {
      return false;
    }

    const promptKey = this.getPromptKey(userId, profileTimezone);
    return (
      this.dismissedPromptKey() !== promptKey &&
      this.getStoredPromptDecision(promptKey) !== 'dismissed'
    );
  });

  dismissPrompt(): void {
    const userId = this.user()?.id;
    const profileTimezone = this.profileTimezone();

    if (!userId || !profileTimezone) return;

    const promptKey = this.getPromptKey(userId, profileTimezone);
    this.dismissedPromptKey.set(promptKey);
    this.storePromptDecision(promptKey, 'dismissed');
  }

  async useDeviceTimezone(): Promise<void> {
    const user = this.user();

    if (!user || !isValidTimezone(this.browserTimezone)) return;

    const update$ =
      user.role === 'mentor'
        ? this.profileService.updateMentorProfile(user.id, {
            timezone: this.browserTimezone,
          })
        : this.profileService.updateMenteeProfile(user.id, {
            timezone: this.browserTimezone,
          });

    await firstValueFrom(update$.pipe(take(1)));

    this.deviceTimezoneOverride.set({
      userId: user.id,
      timezone: this.browserTimezone,
    });
    this.dismissPrompt();
  }

  private getStoredPromptDecision(promptKey: string): string | null {
    if (typeof localStorage === 'undefined') return null;

    return localStorage.getItem(`gurokonekt.timezone-prompt.${promptKey}`);
  }

  private storePromptDecision(promptKey: string, decision: string): void {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(`gurokonekt.timezone-prompt.${promptKey}`, decision);
  }

  private getPromptKey(userId: string, profileTimezone: string): string {
    return `${userId}:${profileTimezone}:${this.browserTimezone}`;
  }
}
