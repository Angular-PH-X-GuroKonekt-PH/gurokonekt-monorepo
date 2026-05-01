import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import {
  getNotificationIconClasses,
  getNotificationIconName,
  getNotificationTypeClasses,
  getNotificationTypeLabel,
} from '../../../helpers/notification-display.helper';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-navbar-notification-item',
  imports: [CommonModule, IconComponent],
  templateUrl: './navbar-notification-item.html',
})
export class NavbarNotificationItem {
  readonly notification = input.required<NotificationInterface>();
  readonly markAsRead = output<NotificationInterface>();

  protected readonly unreadStatus = NotificationStatus.UNREAD;
  protected readonly getNotificationTypeLabel = getNotificationTypeLabel;
  protected readonly getNotificationTypeClasses = getNotificationTypeClasses;
  protected readonly getNotificationIconName = getNotificationIconName;
  protected readonly getNotificationIconClasses = getNotificationIconClasses;

  protected onMarkAsRead(): void {
    this.markAsRead.emit(this.notification());
  }
}
