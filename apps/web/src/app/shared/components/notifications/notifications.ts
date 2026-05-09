import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import { NotificationService } from '../../services/notification.service';
import {
  getNotificationIconClasses,
  getNotificationIconName,
  getNotificationTypeClasses,
  getNotificationTypeLabel,
} from '../../../helpers/notification-display.helper';
import { IconComponent } from '../icon/icon.component';
import { SectionCard } from '../section-card/section-card';
import { SectionTitle } from '../section-title/section-title';
import { NotificationListSkeleton } from '../loaders/notification-list-skeleton/notification-list-skeleton';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, SectionCard, SectionTitle, IconComponent, NotificationListSkeleton],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {
  private readonly notificationService = inject(NotificationService);












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
      this.notifications().filter(
        (notification) => notification.status === NotificationStatus.UNREAD
      ).length
  );

  protected markAsRead(notification: NotificationInterface): void {
    if (notification.status === NotificationStatus.READ) {
      return;
    }

    void firstValueFrom(this.notificationService.markAsRead(notification.id)).catch(
      () => undefined
    );
  }

  

  protected readonly getNotificationTypeLabel = getNotificationTypeLabel;
  protected readonly getNotificationTypeClasses = getNotificationTypeClasses;
  protected readonly getNotificationIconName = getNotificationIconName;
  protected readonly getNotificationIconClasses = getNotificationIconClasses;
}
