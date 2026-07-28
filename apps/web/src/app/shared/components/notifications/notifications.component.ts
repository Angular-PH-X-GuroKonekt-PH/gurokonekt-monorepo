import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import {
  getNotificationIconClasses,
  getNotificationIconName,
  getNotificationTypeClasses,
  getNotificationTypeLabel,
} from '../../utils/notification-display.util';
import { IconComponent } from '../icon/icon.component';
import { SectionCard } from '../section-card/section-card.component';
import { SectionTitle } from '../section-title/section-title.component';
import { NotificationListSkeleton } from '../skeleton-loaders/notification-list-skeleton/notification-list-skeleton.component';

@Component({
  selector: 'app-notifications',
  imports: [
    CommonModule,
    SectionCard,
    SectionTitle,
    IconComponent,
    NotificationListSkeleton,
  ],
  templateUrl: './notifications.component.html',
})
export class Notifications {
  private readonly notificationService = inject(NotificationService);
  private readonly toastService = inject(ToastService);

  private readonly deletingIds = signal<Set<string>>(new Set());

  protected readonly fetchNotifications = toSignal<
    NotificationInterface[] | null
  >(this.notificationService.getMyNotifications(), { initialValue: null });

  protected readonly notifications = toSignal(
    this.notificationService.notifications$,
    { initialValue: [] as NotificationInterface[] },
  );

  protected readonly isNotificationsLoading = computed(
    () => this.fetchNotifications() === null,
  );

  protected readonly unreadCount = computed(
    () =>
      this.notifications().filter(
        (notification) => notification.status === NotificationStatus.UNREAD,
      ).length,
  );

  protected markAsRead(notification: NotificationInterface): void {
    if (notification.status === NotificationStatus.READ) {
      return;
    }

    void firstValueFrom(
      this.notificationService.markAsRead(notification.id),
    ).catch(() => undefined);
  }

  protected isDeleting(id: string): boolean {
    return this.deletingIds().has(id);
  }

  protected async deleteNotification(
    notification: NotificationInterface,
  ): Promise<void> {
    if (this.isDeleting(notification.id)) {
      return;
    }

    this.updateDeletingState(notification.id, true);

    try {
      const deleted = await firstValueFrom(
        this.notificationService.deleteNotification(notification.id),
      );

      if (deleted) {
        this.toastService.success(
          'Notification removed.',
          'Notification deleted',
        );
      } else {
        this.toastService.error(
          'The notification could not be removed. Please try again.',
          'Delete failed',
        );
      }
    } finally {
      this.updateDeletingState(notification.id, false);
    }
  }

  protected readonly getNotificationTypeLabel = getNotificationTypeLabel;
  protected readonly getNotificationTypeClasses = getNotificationTypeClasses;
  protected readonly getNotificationIconName = getNotificationIconName;
  protected readonly getNotificationIconClasses = getNotificationIconClasses;

  private updateDeletingState(id: string, deleting: boolean): void {
    this.deletingIds.update((ids) => {
      const updatedIds = new Set(ids);
      if (deleting) {
        updatedIds.add(id);
      } else {
        updatedIds.delete(id);
      }
      return updatedIds;
    });
  }
}
