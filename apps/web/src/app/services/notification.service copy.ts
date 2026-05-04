import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import { buildApiUrl } from '../helpers/api.helper';
import { HttpErrorHelper } from '../helpers/http-error.helper';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);

  private readonly notificationsSignal = signal<NotificationInterface[]>([]);
  private readonly loadingSignal = signal(false);
  private hasLoaded = false;

  readonly notifications$ = toObservable(this.notificationsSignal);
  readonly loading$ = toObservable(this.loadingSignal);

  loadMyNotifications(force = false): Observable<NotificationInterface[]> {
    if (this.hasLoaded && !force) {
      return of(this.notificationsSignal());
    }

    this.loadingSignal.set(true);

    const request$ = this.http
      .get<ApiResponse<NotificationInterface[]>>(buildApiUrl('/notification/me'))
      .pipe(map((response) => response.data ?? []));

    return request$.pipe(
      map((notifications) => notifications.map((notification) => this.normalizeNotification(notification))),
      tap((notifications) => {
        this.notificationsSignal.set(notifications);
        this.hasLoaded = true;
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.notificationsSignal.set([]);

        return throwError(() => ({
          message: HttpErrorHelper.getErrorMessage(error),
          statusCode: error?.status ?? 500,
        }));
      })
    );
  }

  markAsRead(id: string): Observable<NotificationInterface | null> {
    const existing = this.notificationsSignal().find(
      (notification) => notification.id === id
    );

    if (existing?.status === NotificationStatus.READ) {
      return of(existing);
    }

    return this.http
      .patch<ApiResponse<NotificationInterface>>(
        buildApiUrl(`/notification/${id}/read`),
        {}
      )
      .pipe(
        map((response) =>
          response.data ? this.normalizeNotification(response.data) : null
        ),
        tap((updated) => {
          if (updated) {
            this.updateCachedNotification(updated);
          }
        }),
        catchError((error) =>
          throwError(() => ({
            message: HttpErrorHelper.getErrorMessage(error),
            statusCode: error?.status ?? 500,
          }))
        )
      );
  }

  private updateCachedNotification(
    updatedNotification: NotificationInterface
  ): void {
    const updatedNotifications = this.notificationsSignal().map(
      (notification) =>
        notification.id === updatedNotification.id
          ? updatedNotification
          : notification
    );

    this.notificationsSignal.set(updatedNotifications);
  }

  private normalizeNotification(
    notification: NotificationInterface
  ): NotificationInterface {
    return {
      ...notification,
      createdAt: new Date(notification.createdAt),
      updatedAt: new Date(notification.updatedAt),
      readAt: notification.readAt ? new Date(notification.readAt) : undefined,
    };
  }
}
