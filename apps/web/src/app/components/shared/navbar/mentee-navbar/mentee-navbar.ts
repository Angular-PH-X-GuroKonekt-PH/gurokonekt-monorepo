import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import * as AuthActions from '../../../../store/auth/auth.actions';
import {
  getNotificationIconClasses,
  getNotificationIconName,
  getNotificationTypeClasses,
  getNotificationTypeLabel,
} from '../../../../helpers/notification-display.helper';
import { AuthState } from '../../../../store/auth/auth.state';
import { NotificationService } from '../../../../services/notification.service';
import { ProfileService } from '../../../../services/profile.service';
import { IconComponent } from '../../icon/icon.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-mentee-navbar',
  imports: [RouterLink, CommonModule, IconComponent],
  templateUrl: './mentee-navbar.html',
  styleUrl: './mentee-navbar.scss',
})
export class MenteeNavbar {
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);
  private readonly notificationService = inject(NotificationService);

  protected readonly user = this.store.selectSignal(AuthState.user);

  protected readonly getNotificationTypeLabel = getNotificationTypeLabel;
  protected readonly getNotificationTypeClasses = getNotificationTypeClasses;
  protected readonly getNotificationIconName = getNotificationIconName;
  protected readonly getNotificationIconClasses = getNotificationIconClasses;

  protected readonly userFullName = computed(() => {
    const currentUser = this.user();
    const fullName = currentUser?.['fullName'];

    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }

    const email = currentUser?.['email'];
    if (typeof email === 'string' && email.includes('@')) {
      return email.split('@')[0];
    }

    return 'Mentee';
  });

  protected readonly userEmail = computed(() => {
    const email = this.user()?.['email'];
    return typeof email === 'string' && email.trim()
      ? email
      : 'No email available';
  });

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
