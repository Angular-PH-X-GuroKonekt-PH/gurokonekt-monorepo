import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, tap } from 'rxjs';

import { NotificationInterface } from '@gurokonekt/models/interfaces/notification/notification.model';

import { buildApiUrl } from '../helpers/api.helper';
import {
  handleApiErrorWithFallback,
  validateApiResponse,
} from '../helpers/api-response.helper';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly notificationsSignal = signal<NotificationInterface[]>([]);

  readonly notifications$ = toObservable(this.notificationsSignal);

  getMyNotifications(): Observable<NotificationInterface[]> {
    return this.http
      .get<ApiResponse<NotificationInterface[]>>(
        buildApiUrl('/notification/me')
      )
      .pipe(
        map((response) =>
          validateApiResponse<NotificationInterface[]>(
            response,
            'Failed to fetch notifications.'
          )
        ),
        map((notifications) =>
          notifications.map((notification) => ({
            ...notification,
            createdAt: new Date(notification.createdAt),
            updatedAt: new Date(notification.updatedAt),
            readAt: notification.readAt
              ? new Date(notification.readAt)
              : undefined,
          }))
        ),
        tap((notifications) => {
          this.notificationsSignal.set(notifications);
        }),
        catchError(
          handleApiErrorWithFallback([], 'Failed to fetch notifications')
        )
      );
  }

  markAsRead(id: string): Observable<NotificationInterface | null> {
    return this.http
      .patch<ApiResponse<NotificationInterface>>(
        buildApiUrl(`/notification/${id}/read`),
        {}
      )
      .pipe(
        map((response) =>
          validateApiResponse<NotificationInterface | null>(
            response,
            'Failed to mark notification as read.'
          )
        ),
        map((notification) =>
          notification
            ? {
                ...notification,
                createdAt: new Date(notification.createdAt),
                updatedAt: new Date(notification.updatedAt),
                readAt: notification.readAt
                  ? new Date(notification.readAt)
                  : undefined,
              }
            : null
        ),
        tap((updatedNotification) => {
          if (!updatedNotification) {
            return;
          }

          this.notificationsSignal.update((notifications) =>
            notifications.map((notification) =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            )
          );
        }),
        catchError(
          handleApiErrorWithFallback(
            null,
            'Failed to mark notification as read'
          )
        )
      );
  }
}
