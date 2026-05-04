import { NotificationType } from '@gurokonekt/models/interfaces/notification/notification.model';

import { IconName } from '../components/shared/icon/icon.component';

export function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case NotificationType.BOOKING:
      return 'Booking';
    case NotificationType.SESSION:
      return 'Session';
    case NotificationType.MESSAGE:
      return 'Message';
    case NotificationType.ANNOUNCEMENT:
      return 'Announcement';
    default:
      return type;
  }
}

export function getNotificationTypeClasses(type: NotificationType): string {
  switch (type) {
    case NotificationType.BOOKING:
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case NotificationType.SESSION:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case NotificationType.MESSAGE:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case NotificationType.ANNOUNCEMENT:
      return 'bg-violet-50 text-violet-700 border-violet-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export function getNotificationIconName(type: NotificationType): IconName {
  switch (type) {
    case NotificationType.BOOKING:
      return 'book-open';
    case NotificationType.SESSION:
      return 'calendar-days';
    case NotificationType.MESSAGE:
      return 'chat-bubble-left-right';
    case NotificationType.ANNOUNCEMENT:
      return 'bell';
    default:
      return 'bell';
  }
}

export function getNotificationIconClasses(type: NotificationType): string {
  switch (type) {
    case NotificationType.BOOKING:
      return 'bg-orange-50 text-orange-600 ring-orange-100';
    case NotificationType.SESSION:
      return 'bg-blue-50 text-blue-700 ring-blue-100';
    case NotificationType.MESSAGE:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case NotificationType.ANNOUNCEMENT:
      return 'bg-violet-50 text-violet-700 ring-violet-100';
    default:
      return 'bg-slate-50 text-slate-700 ring-slate-100';
  }
}
