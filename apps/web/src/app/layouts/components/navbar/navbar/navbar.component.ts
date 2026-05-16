import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom, of } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

import {
  NotificationInterface,
  NotificationStatus,
} from '@gurokonekt/models/interfaces/notification/notification.model';
import { UserInterface } from '@gurokonekt/models/interfaces/user/user.model';

import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { NavbarNotificationItem } from '../../../../shared/components/navbar-notification-item/navbar-notification-item.component';
import { NotificationListSkeleton } from '../../../../shared/components/skeleton-loaders/notification-list-skeleton/notification-list-skeleton.component';
import { ProfileService } from '../../../../core/profile/profile.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';

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
export class NavbarComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly profileService = inject(ProfileService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // Dropdown states
  protected readonly isNotificationOpen = signal(false);
  protected readonly isUserMenuOpen = signal(false);

  // User data
  protected readonly user = this.store.selectSignal(AuthSelectors.user);
  protected readonly userId = computed(() => this.user()?.id ?? null);
  protected readonly userRole = computed(() => this.user()?.role ?? null);

  protected readonly profile = toSignal(
    toObservable(this.userId).pipe(
      switchMap((userId) => {
        if (!userId) return of(null);

        return this.profileService.getUserProfile(userId).pipe(
          map((response) => response.data as UserInterface | null),
          catchError(() => of(null))
        );
      })
    ),
    { initialValue: null as UserInterface | null }
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

  protected readonly userAvatarUrl = computed(() => {
    const avatarAttachments = this.profile()?.avatarAttachments as
      | { publicUrl?: string }[]
      | undefined;

    return (
      avatarAttachments?.[0]?.publicUrl ||
      'assets/img/no_profile_avatar.png'
    );
  });

  // Notification data
  protected readonly fetchNotifications = toSignal<
    NotificationInterface[] | null
  >(this.notificationService.getMyNotifications(), {
    initialValue: null,
  });

  protected readonly notifications = toSignal(
    this.notificationService.notifications$,
    { initialValue: [] as NotificationInterface[] }
  );

  protected readonly isNotificationsLoading = computed(
    () => this.fetchNotifications() === null
  );

  protected readonly unreadCount = computed(
    () =>
      this.notifications()?.filter(
        (notification) => notification.status === NotificationStatus.UNREAD
      ).length ?? 0
  );

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.closeAllDropdowns());
  }

  protected toggleNotification(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationOpen.update((open) => !open);
    this.isUserMenuOpen.set(false);
  }

  protected toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isUserMenuOpen.update((open) => !open);
    this.isNotificationOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected handleDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeAllDropdowns();
    }
  }

  protected markAsRead(notification: NotificationInterface): void {
    if (notification.status === NotificationStatus.READ) {
      return;
    }

    void firstValueFrom(
      this.notificationService.markAsRead(notification.id)
    ).catch(() => undefined);
  }

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }

  private closeAllDropdowns(): void {
    this.isNotificationOpen.set(false);
    this.isUserMenuOpen.set(false);
  }
}
