import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
  OnDestroy,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import { AuthStorageService } from '../../core/storage/auth-storage.service';
import {
  handleApiErrorWithFallback,
  validateApiResponse,
} from '../helpers/api-response.helper';
import { ApiResponse } from '../interfaces/api-response.interface';
import { buildApiUrl, getApiOrigin } from '../utils/api.util';

const NOTIFICATION_EVENTS = {
  CREATED: 'notification:created',
  UPDATED: 'notification:updated',
  DELETED: 'notification:deleted',
} as const;

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly authStorage = inject(AuthStorageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly notificationsSignal = signal<NotificationInterface[]>([]);

  private socket: Socket | null = null;
  private hasConnected = false;

  readonly notifications$ = toObservable(this.notificationsSignal);

  connectToRealtime(): void {
    if (!isPlatformBrowser(this.platformId) || this.socket) {
      return;
    }

    if (!this.authStorage.getToken()) {
      return;
    }

    this.socket = io(getApiOrigin(), {
      transports: ['websocket', 'polling'],
      auth: (callback) => {
        callback({ token: this.authStorage.getToken() });
      },
    });

    this.socket.on('connect', () => {
      if (this.hasConnected) {
        this.getMyNotifications().subscribe();
      }
      this.hasConnected = true;
    });

    this.socket.on(
      NOTIFICATION_EVENTS.CREATED,
      (notification: NotificationInterface) => {
        this.upsertNotification(notification);
      },
    );

    this.socket.on(
      NOTIFICATION_EVENTS.UPDATED,
      (notification: NotificationInterface) => {
        this.upsertNotification(notification);
      },
    );

    this.socket.on(NOTIFICATION_EVENTS.DELETED, ({ id }: { id: string }) => {
      this.notificationsSignal.update((notifications) =>
        notifications.filter((notification) => notification.id !== id),
      );
    });
  }

  disconnectFromRealtime(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.hasConnected = false;
  }

  ngOnDestroy(): void {
    this.disconnectFromRealtime();
  }

  getMyNotifications(): Observable<NotificationInterface[]> {
    return this.http
      .get<
        ApiResponse<NotificationInterface[]>
      >(buildApiUrl('/notification/me'))
      .pipe(
        map((response) =>
          validateApiResponse<NotificationInterface[]>(
            response,
            'Failed to fetch notifications.',
          ),
        ),
        map((notifications) => notifications.map(toNotification)),
        tap((notifications) => {
          this.notificationsSignal.set(notifications);
        }),
        catchError(
          handleApiErrorWithFallback([], 'Failed to fetch notifications'),
        ),
      );
  }

  markAsRead(id: string): Observable<NotificationInterface | null> {
    return this.http
      .patch<
        ApiResponse<NotificationInterface>
      >(buildApiUrl(`/notification/${id}/read`), {})
      .pipe(
        map((response) =>
          validateApiResponse<NotificationInterface | null>(
            response,
            'Failed to mark notification as read.',
          ),
        ),
        map((notification) =>
          notification ? toNotification(notification) : null,
        ),
        tap((updatedNotification) => {
          if (updatedNotification) {
            this.upsertNotification(updatedNotification);
          }
        }),
        catchError(
          handleApiErrorWithFallback(
            null,
            'Failed to mark notification as read',
          ),
        ),
      );
  }

  deleteNotification(id: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<null>>(buildApiUrl(`/notification/${id}`))
      .pipe(
        map((response) => {
          validateApiResponse<null>(response, 'Failed to delete notification.');
          return true;
        }),
        tap(() => this.removeNotification(id)),
        catchError(
          handleApiErrorWithFallback(false, 'Failed to delete notification'),
        ),
      );
  }

  private upsertNotification(notification: NotificationInterface): void {
    const normalizedNotification = toNotification(notification);

    if (normalizedNotification.status === NotificationStatus.DELETED) {
      this.removeNotification(normalizedNotification.id);
      return;
    }

    this.notificationsSignal.update((notifications) =>
      [
        normalizedNotification,
        ...notifications.filter(
          (existing) => existing.id !== normalizedNotification.id,
        ),
      ].sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      ),
    );
  }

  private removeNotification(id: string): void {
    this.notificationsSignal.update((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    );
  }
}

const toNotification = (
  notification: NotificationInterface,
): NotificationInterface => ({
  ...notification,
  createdAt: new Date(notification.createdAt),
  updatedAt: new Date(notification.updatedAt),
  readAt: notification.readAt ? new Date(notification.readAt) : undefined,
});
