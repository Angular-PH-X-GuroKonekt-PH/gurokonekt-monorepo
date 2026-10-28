import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Actions, Store } from '@ngxs/store';
import { BehaviorSubject, NEVER, of, Subject } from 'rxjs';
import { vi } from 'vitest';

import {
  NotificationInterface,
  NotificationStatus,
  NotificationType,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import { ProfileService } from '../../../../core/profile/profile.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent notifications', () => {
  const notifications = [
    createNotification('read-newest', NotificationStatus.READ, 6),
    createNotification('unread-newest', NotificationStatus.UNREAD, 5),
    createNotification('read-second', NotificationStatus.READ, 4),
    createNotification('unread-second', NotificationStatus.UNREAD, 3),
    createNotification('read-omitted', NotificationStatus.READ, 2),
    createNotification('unread-third', NotificationStatus.UNREAD, 1),
  ];
  let notifications$: BehaviorSubject<NotificationInterface[]>;

  beforeEach(() => {
    notifications$ = new BehaviorSubject(notifications);

    TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        {
          provide: Store,
          useValue: {
            selectSignal: () => signal({ id: 'user-1', role: 'mentor' }),
            dispatch: vi.fn(),
          },
        },
        { provide: Actions, useValue: NEVER },
        {
          provide: ProfileService,
          useValue: { getUserProfile: () => of({ data: null }) },
        },
        {
          provide: NotificationService,
          useValue: {
            notifications$,
            getMyNotifications: () => of(notifications),
            connectToRealtime: vi.fn(),
            disconnectFromRealtime: vi.fn(),
            markAsRead: vi.fn((id: string) => {
              const updatedNotifications = notifications$.value.map(
                (notification) =>
                  notification.id === id
                    ? { ...notification, status: NotificationStatus.READ }
                    : notification,
              );
              const updatedNotification = updatedNotifications.find(
                (notification) => notification.id === id,
              );

              notifications$.next(updatedNotifications);
              return of(updatedNotification ?? null);
            }),
            deleteNotification: vi.fn((id: string) => {
              notifications$.next(
                notifications$.value.filter(
                  (notification) => notification.id !== id,
                ),
              );
              return of(true);
            }),
          },
        },
      ],
    });
  });

  it('filters the five-item notification preview by read status', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const filterButtons = Array.from(
      element.querySelectorAll<HTMLButtonElement>('[data-notification-filter]'),
    );
    const renderedTitles = () =>
      Array.from(
        element.querySelectorAll('app-navbar-notification-item'),
        (item) => item.textContent ?? '',
      );

    expect(filterButtons.map((button) => button.textContent?.trim())).toEqual([
      'All',
      'Unread',
      'Read',
    ]);
    expect(filterButtons[0].getAttribute('aria-pressed')).toBe('true');
    expect(renderedTitles()).toHaveLength(5);
    expect(renderedTitles()).toEqual([
      expect.stringContaining('read-newest'),
      expect.stringContaining('unread-newest'),
      expect.stringContaining('read-second'),
      expect.stringContaining('unread-second'),
      expect.stringContaining('read-omitted'),
    ]);

    filterButtons[1].click();
    fixture.detectChanges();
    expect(filterButtons[1].getAttribute('aria-pressed')).toBe('true');
    expect(renderedTitles()).toEqual([
      expect.stringContaining('unread-newest'),
      expect.stringContaining('unread-second'),
      expect.stringContaining('unread-third'),
    ]);

    filterButtons[2].click();
    fixture.detectChanges();
    expect(filterButtons[2].getAttribute('aria-pressed')).toBe('true');
    expect(renderedTitles()).toEqual([
      expect.stringContaining('read-newest'),
      expect.stringContaining('read-second'),
      expect.stringContaining('read-omitted'),
    ]);
  });

  it('keeps keyboard focus on a notification when it becomes read', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const focusedItem = Array.from(
      element.querySelectorAll<HTMLButtonElement>(
        'app-navbar-notification-item [data-notification-body]',
      ),
    ).find((item) => item.textContent?.includes('unread-newest'));

    expect(focusedItem).toBeTruthy();
    focusedItem?.focus();

    notifications$.next(
      notifications.map((notification) =>
        notification.id === 'unread-newest'
          ? { ...notification, status: NotificationStatus.READ }
          : notification,
      ),
    );
    fixture.detectChanges();

    expect(focusedItem?.isConnected).toBe(true);
    expect(document.activeElement).toBe(focusedItem);
  });

  it('moves focus to the next notification when a focused unread item becomes read', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    element
      .querySelector<HTMLButtonElement>('[data-notification-filter="unread"]')
      ?.click();
    fixture.detectChanges();

    const notificationButtons = Array.from(
      element.querySelectorAll<HTMLButtonElement>(
        'app-navbar-notification-item [data-notification-body]',
      ),
    );
    notificationButtons[0].focus();
    notificationButtons[0].click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(notificationButtons[1]);
  });

  it('returns focus to the unread filter after its last notification becomes read', () => {
    notifications$.next([
      createNotification('only-unread', NotificationStatus.UNREAD, 2),
      createNotification('already-read', NotificationStatus.READ, 1),
    ]);

    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const unreadFilter = element.querySelector<HTMLButtonElement>(
      '[data-notification-filter="unread"]',
    );
    unreadFilter?.click();
    fixture.detectChanges();

    const notificationButton = element.querySelector<HTMLButtonElement>(
      'app-navbar-notification-item [data-notification-body]',
    );
    notificationButton?.focus();
    notificationButton?.click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(unreadFilter);
  });

  it('deletes a notification immediately from its actions menu', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="More actions for read-newest"]',
      )
      ?.click();
    fixture.detectChanges();

    const deleteButton = element.querySelector<HTMLButtonElement>(
      '[aria-label="Delete notification: read-newest"]',
    );
    expect(deleteButton).toBeTruthy();

    deleteButton?.click();
    fixture.detectChanges();

    expect(element.textContent).not.toContain('read-newest');
  });

  it('marks an unread notification as read from its actions menu', () => {
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="More actions for unread-newest"]',
      )
      ?.click();
    fixture.detectChanges();

    const markAsReadButton = element.querySelector<HTMLButtonElement>(
      '[data-notification-mark-read]',
    );
    expect(markAsReadButton).toBeTruthy();

    markAsReadButton?.click();
    fixture.detectChanges();

    expect(
      element.querySelector('[aria-label="Open notification: unread-newest"]'),
    ).toBeTruthy();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it.each([NotificationType.BOOKING, NotificationType.SESSION])(
    'routes a selected %s notification to its related booking',
    async (type) => {
      notifications$.next([
        {
          ...createNotification('linked-booking', NotificationStatus.UNREAD, 1),
          type,
          referenceId: 'booking-42',
        },
      ]);
      const navigateSpy = vi
        .spyOn(TestBed.inject(Router), 'navigate')
        .mockResolvedValue(true);
      const fixture = TestBed.createComponent(NavbarComponent);
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      element
        .querySelector<HTMLButtonElement>('[data-notification-body]')
        ?.click();
      await fixture.whenStable();

      expect(navigateSpy).toHaveBeenCalledWith(['booking-overview'], {
        queryParams: { bookingId: 'booking-42' },
      });
    },
  );

  it('does not route a notification without a related booking', async () => {
    notifications$.next([
      createNotification('unlinked-booking', NotificationStatus.UNREAD, 1),
    ]);
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-notification-body]')
      ?.click();
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('waits for an unread notification to be marked read before routing', async () => {
    const notification = {
      ...createNotification(
        'delayed-linked-booking',
        NotificationStatus.UNREAD,
        1,
      ),
      referenceId: 'booking-42',
    };
    notifications$.next([notification]);
    const readResult = new Subject<NotificationInterface | null>();
    vi.mocked(TestBed.inject(NotificationService).markAsRead).mockReturnValue(
      readResult,
    );
    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-notification-body]')
      ?.click();
    expect(navigateSpy).not.toHaveBeenCalled();

    readResult.next({ ...notification, status: NotificationStatus.READ });
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['booking-overview'], {
      queryParams: { bookingId: 'booking-42' },
    });
  });

  it('shows five older notifications at a time and resets when filters change', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const renderedItems = () =>
      element.querySelectorAll('app-navbar-notification-item');
    const showOlderButton = () =>
      element.querySelector<HTMLButtonElement>(
        '[data-notification-show-older]',
      );
    const notificationList = () =>
      element.querySelector<HTMLElement>('[data-notification-list]');

    expect(renderedItems()).toHaveLength(5);
    expect(showOlderButton()).toBeTruthy();
    expect(notificationList()?.classList.contains('overflow-y-auto')).toBe(
      false,
    );

    Object.defineProperty(notificationList(), 'offsetHeight', {
      configurable: true,
      value: 420,
    });

    showOlderButton()?.click();
    fixture.detectChanges();
    expect(renderedItems()).toHaveLength(6);
    expect(showOlderButton()).toBeNull();
    expect(notificationList()?.classList.contains('overflow-y-auto')).toBe(
      true,
    );
    expect(notificationList()?.style.height).toBe('420px');

    element
      .querySelector<HTMLButtonElement>('[data-notification-filter="unread"]')
      ?.click();
    element
      .querySelector<HTMLButtonElement>('[data-notification-filter="all"]')
      ?.click();
    fixture.detectChanges();

    expect(renderedItems()).toHaveLength(5);
    expect(showOlderButton()).toBeTruthy();
    expect(notificationList()?.classList.contains('overflow-y-auto')).toBe(
      false,
    );
    expect(notificationList()?.style.height).toBe('');
  });
});

function createNotification(
  id: string,
  status: NotificationStatus,
  minute: number,
): NotificationInterface {
  const date = new Date(`2026-01-01T00:0${minute}:00.000Z`);

  return {
    id,
    userId: 'user-1',
    title: id,
    message: `${id} message`,
    type: NotificationType.BOOKING,
    status,
    createdAt: date,
    updatedAt: date,
  };
}
