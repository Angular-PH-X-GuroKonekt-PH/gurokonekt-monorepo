import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take } from 'rxjs';
import { vi } from 'vitest';

import {
  NotificationInterface,
  NotificationStatus,
  NotificationType,
} from '@gurokonekt/models/interfaces/notification/notification.model';

import { AuthStorageService } from '../../core/storage/auth-storage.service';
import { NotificationService } from './notification.service';

const socketMock = vi.hoisted(() => ({
  handlers: new Map<string, (payload?: unknown) => void>(),
  on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
    socketMock.handlers.set(event, handler);
  }),
  disconnect: vi.fn(),
}));

const ioMock = vi.hoisted(() => vi.fn(() => socketMock));

vi.mock('socket.io-client', () => ({
  io: ioMock,
}));

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    socketMock.handlers.clear();
    socketMock.on.mockClear();
    socketMock.disconnect.mockClear();
    ioMock.mockClear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    TestBed.inject(AuthStorageService).setToken('access-token');
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.disconnectFromRealtime();
    TestBed.inject(AuthStorageService).clear();
    httpMock.verify();
  });

  it('adds a newly created WebSocket notification to the shared list', async () => {
    service.connectToRealtime();

    expect(ioMock).toHaveBeenCalledOnce();
    expect(socketMock.handlers.has('notification:created')).toBe(true);

    const notification = createNotification('notification-1');
    socketMock.handlers.get('notification:created')?.(notification);

    const notifications = await firstValueFrom(
      service.notifications$.pipe(take(1)),
    );

    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe(notification.id);
    expect(notifications[0].createdAt).toBeInstanceOf(Date);
  });

  it('updates read status after the mark-as-read endpoint succeeds', async () => {
    const resultPromise = firstValueFrom(service.markAsRead('notification-1'));

    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/notification/notification-1/read'),
    );
    request.flush({
      status: 'success',
      statusCode: 200,
      message: 'Notification updated successfully',
      data: {
        ...createNotification('notification-1'),
        status: NotificationStatus.READ,
        readAt: new Date().toISOString(),
      },
    });

    const notification = await resultPromise;
    expect(notification?.status).toBe(NotificationStatus.READ);
    expect(notification?.readAt).toBeInstanceOf(Date);
  });

  it('removes a notification after the delete endpoint succeeds', async () => {
    service.connectToRealtime();
    const notification = createNotification('notification-1');
    socketMock.handlers.get('notification:created')?.(notification);

    const resultPromise = firstValueFrom(
      service.deleteNotification(notification.id),
    );

    const request = httpMock.expectOne((req) =>
      req.url.endsWith('/notification/notification-1'),
    );
    expect(request.request.method).toBe('DELETE');
    request.flush({
      status: 'success',
      statusCode: 200,
      message: 'Notification deleted successfully',
      data: null,
    });

    expect(await resultPromise).toBe(true);

    const notifications = await firstValueFrom(
      service.notifications$.pipe(take(1)),
    );
    expect(notifications).toEqual([]);
  });
});

function createNotification(id: string): NotificationInterface {
  const now = new Date();

  return {
    id,
    userId: 'mentor-1',
    title: 'New Booking Request',
    message: 'You have received a new booking request.',
    type: NotificationType.BOOKING,
    status: NotificationStatus.UNREAD,
    referenceId: 'booking-1',
    createdAt: now,
    updatedAt: now,
  };
}
