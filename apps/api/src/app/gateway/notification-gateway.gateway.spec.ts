import {
  NotificationStatus,
  NotificationType,
  UserStatus,
} from '@gurokonekt/models';
import { Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  NOTIFICATION_EVENTS,
  NotificationGateway,
} from './notification-gateway.gateway';

describe('NotificationGateway', () => {
  const getUser = jest.fn();
  const findUnique = jest.fn();
  let gateway: NotificationGateway;

  beforeEach(() => {
    jest.clearAllMocks();

    gateway = new NotificationGateway(
      {
        client: { auth: { getUser } },
      } as unknown as SupabaseService,
      {
        db: { user: { findUnique } },
      } as unknown as PrismaService,
    );
  });

  it('authenticates the token and joins the user notification room', async () => {
    const client = createSocket('access-token');
    getUser.mockResolvedValue({
      data: { user: { id: 'mentor-1' } },
      error: null,
    });
    findUnique.mockResolvedValue({ status: UserStatus.Approved });

    await gateway.handleConnection(client);

    expect(getUser).toHaveBeenCalledWith('access-token');
    expect(client.join).toHaveBeenCalledWith('notifications:mentor-1');
    expect(client.data['userId']).toBe('mentor-1');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('rejects a connection without an access token', async () => {
    const client = createSocket();

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('emits notification events to every socket in the user room', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    gateway.server = { to } as unknown as NotificationGateway['server'];
    const notification = {
      id: 'notification-1',
      userId: 'mentor-1',
      title: 'New Booking Request',
      message: 'You have received a new booking request.',
      type: NotificationType.BOOKING,
      status: NotificationStatus.UNREAD,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    gateway.sendNotificationToUser(
      'mentor-1',
      notification,
      NOTIFICATION_EVENTS.CREATED,
    );

    expect(to).toHaveBeenCalledWith('notifications:mentor-1');
    expect(emit).toHaveBeenCalledWith(
      NOTIFICATION_EVENTS.CREATED,
      notification,
    );
  });
});

function createSocket(token?: string): Socket {
  return {
    id: 'socket-1',
    data: {},
    handshake: {
      auth: token ? { token } : {},
      headers: {},
    },
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  } as unknown as Socket;
}
