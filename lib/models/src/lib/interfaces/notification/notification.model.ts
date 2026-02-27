export enum NotificationType {
  BOOKING = 'BOOKING',
  SESSION = 'SESSION',
  MESSAGE = 'MESSAGE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  DELETED = 'DELETED',
}

export interface NotificationInterface {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  referenceId?: string;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}
