import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { Actions, ofActionSuccessful, Store } from '@ngxs/store';
import { firstValueFrom, merge, of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

import {
  NotificationInterface,
  NotificationStatus,
  NotificationType,
} from '@gurokonekt/models/interfaces/notification/notification.model';
import { UserInterface } from '@gurokonekt/models/interfaces/user/user.model';

import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { NavbarNotificationItem } from '../../../../shared/components/navbar-notification-item/navbar-notification-item.component';
import { NotificationListSkeleton } from '../../../../shared/components/skeleton-loaders/notification-list-skeleton/notification-list-skeleton.component';
import { ProfileService } from '../../../../core/profile/profile.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';
import { resolveAvatarPublicUrl } from '../../../../shared/utils/avatar-url.util';
import { APP_ROUTES } from '../../../../shared/constants/routes';

const NOTIFICATION_PREVIEW_LIMIT = 5;
type NotificationFilter = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    CommonModule,
    IconComponent,
    NavbarNotificationItem,
    NotificationListSkeleton,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly profileService = inject(ProfileService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Dropdown states
  protected readonly isNotificationOpen = signal(false);
  protected readonly isUserMenuOpen = signal(false);
  protected readonly notificationFilter = signal<NotificationFilter>('all');
  protected readonly notificationPreviewLimit = signal(
    NOTIFICATION_PREVIEW_LIMIT,
  );
  protected readonly notificationListHeight = signal<number | null>(null);
  protected readonly openNotificationMenuId = signal<string | null>(null);
  private readonly deletingNotificationIds = signal<Set<string>>(new Set());

  // User data
  protected readonly user = this.store.selectSignal(AuthSelectors.user);
  protected readonly userId = computed(() => this.user()?.id ?? null);
  protected readonly userRole = computed(() => this.user()?.role ?? null);

  protected readonly profile = toSignal(
    merge(
      toObservable(this.userId),
      this.actions$.pipe(
        ofActionSuccessful(
          AuthActions.UpdateMentorProfileSuccess,
          AuthActions.UpdateMenteeProfileSuccess,
        ),
        map(() => this.userId()),
      ),
    ).pipe(
      switchMap((userId) => {
        if (!userId) return of(null);

        return this.profileService.getUserProfile(userId).pipe(
          map((response) => response.data as UserInterface | null),
          catchError(() => of(null)),
        );
      }),
    ),
    { initialValue: null as UserInterface | null },
  );

  protected readonly userFullName = computed(() => {
    const profile = this.profile();
    if (profile) {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      if (fullName) return fullName;
    }

    const role = this.userRole();
    return role === 'mentor' ? 'Mentor' : 'Mentee';
  });

  protected readonly userEmail = computed(() => {
    return this.profile()?.email?.trim() || 'No email available';
  });

  protected readonly userAvatarUrl = computed(() =>
    resolveAvatarPublicUrl(this.profile()),
  );

  // Notification data
  protected readonly fetchNotifications = toSignal<
    NotificationInterface[] | null
  >(this.notificationService.getMyNotifications(), {
    initialValue: null,
  });

  protected readonly notifications = toSignal(
    this.notificationService.notifications$,
    { initialValue: [] as NotificationInterface[] },
  );

  protected readonly isNotificationsLoading = computed(
    () => this.fetchNotifications() === null,
  );

  protected readonly unreadCount = computed(
    () =>
      this.notifications()?.filter(
        (notification) => notification.status === NotificationStatus.UNREAD,
      ).length ?? 0,
  );

  private readonly matchingNotifications = computed(() => {
    const filter = this.notificationFilter();
    const notifications = this.notifications();

    if (filter === 'all') {
      return notifications;
    }

    const status =
      filter === 'unread' ? NotificationStatus.UNREAD : NotificationStatus.READ;

    return notifications.filter(
      (notification) => notification.status === status,
    );
  });

  protected readonly filteredNotifications = computed(() =>
    this.matchingNotifications().slice(0, this.notificationPreviewLimit()),
  );

  protected readonly hasOlderNotifications = computed(
    () =>
      this.matchingNotifications().length > this.filteredNotifications().length,
  );

  ngOnInit(): void {
    this.notificationService.connectToRealtime();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.closeAllDropdowns());
  }

  ngOnDestroy(): void {
    this.notificationService.disconnectFromRealtime();
  }

  protected toggleNotification(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationOpen.update((open) => !open);
    this.isUserMenuOpen.set(false);
    this.openNotificationMenuId.set(null);
  }

  protected toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserMenuOpen.update((open) => !open);
    this.isNotificationOpen.set(false);
    this.openNotificationMenuId.set(null);
  }

  protected setNotificationFilter(filter: NotificationFilter): void {
    this.notificationFilter.set(filter);
    this.notificationPreviewLimit.set(NOTIFICATION_PREVIEW_LIMIT);
    this.notificationListHeight.set(null);
    this.openNotificationMenuId.set(null);
  }

  protected showOlderNotifications(): void {
    if (this.notificationPreviewLimit() === NOTIFICATION_PREVIEW_LIMIT) {
      const root: HTMLElement = this.elementRef.nativeElement;
      const list = root.querySelector<HTMLElement>('[data-notification-list]');
      this.notificationListHeight.set(list?.offsetHeight || null);
    }

    this.notificationPreviewLimit.update(
      (limit) => limit + NOTIFICATION_PREVIEW_LIMIT,
    );
  }

  protected toggleNotificationMenu(notification: NotificationInterface): void {
    this.openNotificationMenuId.update((openId) =>
      openId === notification.id ? null : notification.id,
    );
  }

  protected isDeletingNotification(id: string): boolean {
    return this.deletingNotificationIds().has(id);
  }

  @HostListener('document:click', ['$event'])
  protected handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-notification-menu]')) {
      this.openNotificationMenuId.set(null);
    }

    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeAllDropdowns();
    }
  }

  protected markAsRead(notification: NotificationInterface): void {
    void this.markNotificationAsRead(notification);
  }

  protected async openNotification(
    notification: NotificationInterface,
  ): Promise<void> {
    await this.markNotificationAsRead(notification);

    if (
      !notification.referenceId ||
      (notification.type !== NotificationType.BOOKING &&
        notification.type !== NotificationType.SESSION)
    ) {
      return;
    }

    this.closeAllDropdowns();
    await this.router.navigate([APP_ROUTES.BOOKING_OVERVIEW], {
      queryParams: { bookingId: notification.referenceId },
    });
  }

  private async markNotificationAsRead(
    notification: NotificationInterface,
  ): Promise<void> {
    this.openNotificationMenuId.set(null);

    if (notification.status === NotificationStatus.READ) {
      return;
    }

    if (this.notificationFilter() === 'unread') {
      this.moveFocusFromUnreadNotification();
    }

    await firstValueFrom(
      this.notificationService.markAsRead(notification.id),
    ).catch(() => undefined);
  }

  protected async deleteNotification(
    notification: NotificationInterface,
  ): Promise<void> {
    if (this.isDeletingNotification(notification.id)) {
      return;
    }

    this.moveFocusBeforeDeletingNotification(notification.id);
    this.openNotificationMenuId.set(null);
    this.updateDeletingNotification(notification.id, true);

    try {
      await firstValueFrom(
        this.notificationService.deleteNotification(notification.id),
      );
    } finally {
      this.updateDeletingNotification(notification.id, false);
    }
  }

  protected logout(): void {
    this.notificationService.disconnectFromRealtime();
    void this.store.dispatch(new AuthActions.Logout());
  }

  private closeAllDropdowns(): void {
    this.isNotificationOpen.set(false);
    this.isUserMenuOpen.set(false);
    this.openNotificationMenuId.set(null);
  }

  private updateDeletingNotification(id: string, deleting: boolean): void {
    this.deletingNotificationIds.update((ids) => {
      const updatedIds = new Set(ids);
      if (deleting) {
        updatedIds.add(id);
      } else {
        updatedIds.delete(id);
      }
      return updatedIds;
    });
  }

  private moveFocusBeforeDeletingNotification(id: string): void {
    const root: HTMLElement = this.elementRef.nativeElement;
    const notificationItems = Array.from(
      root.querySelectorAll<HTMLElement>('app-navbar-notification-item'),
    );
    const itemIndex = notificationItems.findIndex(
      (item) => item.dataset['notificationId'] === id,
    );
    const nextItem =
      notificationItems[itemIndex + 1] ?? notificationItems[itemIndex - 1];
    const nextFocusTarget =
      nextItem?.querySelector<HTMLButtonElement>('[data-notification-body]') ??
      root.querySelector<HTMLButtonElement>(
        `[data-notification-filter="${this.notificationFilter()}"]`,
      );

    nextFocusTarget?.focus();
  }

  private moveFocusFromUnreadNotification(): void {
    const root: HTMLElement = this.elementRef.nativeElement;
    const activeElement = root.ownerDocument.activeElement;
    const notificationItems = Array.from(
      root.querySelectorAll<HTMLElement>('app-navbar-notification-item'),
    );
    const activeIndex = notificationItems.findIndex((item) =>
      item.contains(activeElement),
    );

    if (activeIndex < 0) {
      return;
    }

    const nextItem =
      notificationItems[activeIndex + 1] ?? notificationItems[activeIndex - 1];
    const nextFocusTarget =
      nextItem?.querySelector<HTMLButtonElement>('[data-notification-body]') ??
      root.querySelector<HTMLButtonElement>(
        '[data-notification-filter="unread"]',
      );

    nextFocusTarget?.focus();
  }
}
