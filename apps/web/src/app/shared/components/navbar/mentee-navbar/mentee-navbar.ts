import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';
import { UserInterface } from '@gurokonekt/models';

import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { NavbarNotificationItem } from '../../navbar-notification-item/navbar-notification-item';
import { NotificationListSkeleton } from '../../loaders/notification-list-skeleton/notification-list-skeleton';
import { IconComponent } from '../../icon/icon.component';
import { AuthState } from 'apps/web/src/app/core/auth/store/auth.state';
import { ProfileService } from 'apps/web/src/app/features/profile/profile.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-mentee-navbar',
  imports: [RouterLink, CommonModule, IconComponent, NavbarNotificationItem, NotificationListSkeleton],
  templateUrl: './mentee-navbar.html',
  styleUrl: './mentee-navbar.scss',
})
export class MenteeNavbar {
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);
  private readonly notificationService = inject(NotificationService);

  protected readonly user = this.store.selectSignal(AuthState.user);
  protected readonly userId = computed(() => this.user()?.id ?? null);

  protected readonly profile = toSignal(
    toObservable(this.userId).pipe(
      switchMap((userId) => {
        if (!userId) {
          return of(null);
        }

        return this.profileService.getUserProfile(userId).pipe(
          map((response) => response.data as UserInterface | null),
          catchError(() => of(null))
        );
      })
    ),
    { initialValue: null as UserInterface | null }
  );

  protected readonly userFullName = computed(() => {
    const profile = this.profile();
    if (profile) {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      if (fullName) {
        return fullName;
      }
    }

    return 'Mentee';
  });

  protected readonly userEmail = computed(() => {
    return this.profile()?.email?.trim() || 'No email available';
  });

  protected readonly userAvatarUrl = computed(
    () => {
      const avatarAttachments = this.profile()?.avatarAttachments as
        | { publicUrl?: string }[]
        | undefined;

      return (
        avatarAttachments?.[0]?.publicUrl || 'assets/img/no_profile_avatar.png'
      );
    }
  );

  //NOTIFICATIONS

  protected readonly fetchNotifications = toSignal<NotificationInterface[] | null>(
    this.notificationService.getMyNotifications(),
    { initialValue: null }
  );
  protected readonly notifications = toSignal(
    this.notificationService.notifications$,
    { initialValue: [] as NotificationInterface[] }
  );
  protected readonly isNotificationsLoading = computed(
    () => this.fetchNotifications() === null
  );
  protected readonly unreadCount = computed(
    () =>
      this.notifications()?.filter(
        (notification) => notification.status === NotificationStatus.UNREAD
      ).length ?? 0
  );



  protected markAsRead(notification: NotificationInterface): void {
    if (notification.status === NotificationStatus.READ) {
      return;
    }

    void firstValueFrom(
      this.notificationService.markAsRead(notification.id)
    ).catch(() => undefined);
  }

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }

  protected closeNotificationDropdown(): void {
    const dropdown = document.getElementById('dropdownNotification');
    const dropdownButton = document.getElementById(
      'dropdownNotificationButton'
    );

    dropdown?.classList.add('hidden');
    dropdown?.removeAttribute('style');
    dropdownButton?.setAttribute('aria-expanded', 'false');
  }
}
