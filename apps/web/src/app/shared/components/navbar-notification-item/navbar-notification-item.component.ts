import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import { IconComponent } from '../icon/icon.component';
import {
  getNotificationTypeLabel,
  getNotificationTypeClasses,
  getNotificationIconName,
  getNotificationIconClasses,
} from '../../utils/notification-display.util';

@Component({
  selector: 'app-navbar-notification-item',
  imports: [CommonModule, IconComponent],
  templateUrl: './navbar-notification-item.component.html',
})
export class NavbarNotificationItem {
  readonly notification = input.required<NotificationInterface>();
  readonly menuOpen = input(false);
  readonly deleting = input(false);
  readonly openNotification = output<NotificationInterface>();
  readonly markAsRead = output<NotificationInterface>();
  readonly toggleMenu = output<NotificationInterface>();
  readonly deleteNotification = output<NotificationInterface>();

  protected readonly unreadStatus = NotificationStatus.UNREAD;
  protected readonly getNotificationTypeLabel = getNotificationTypeLabel;
  protected readonly getNotificationTypeClasses = getNotificationTypeClasses;
  protected readonly getNotificationIconName = getNotificationIconName;
  protected readonly getNotificationIconClasses = getNotificationIconClasses;

  protected onOpenNotification(): void {
    this.openNotification.emit(this.notification());
  }

  protected onMarkAsRead(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      (event.currentTarget as HTMLElement)
        .closest<HTMLElement>('[data-notification-menu]')
        ?.querySelector<HTMLButtonElement>(':scope > button')
        ?.focus();
    }

    this.markAsRead.emit(this.notification());
  }

  protected onToggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleMenu.emit(this.notification());
  }

  protected onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.deleteNotification.emit(this.notification());
  }
}
