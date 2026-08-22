import {
  NotificationStatus,
  NotificationType,
  ResponseStatus,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../gateway/notification-gateway.gateway';
import { AdminAnnouncementsService } from './admin-announcements.service';

describe('AdminAnnouncementsService', () => {
  const findMany = jest.fn();
  const create = jest.fn();
  const userFindMany = jest.fn();
  const transaction = jest.fn();
  const sendNotificationToUser = jest.fn();
  const service = new AdminAnnouncementsService(
    {
      db: {
        notification: { findMany, create },
        user: { findMany: userFindMany },
        $transaction: transaction,
      },
    } as unknown as PrismaService,
    { sendNotificationToUser } as unknown as NotificationGateway,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns one summary for each sent announcement instead of one row per recipient', async () => {
    const legacyTimestamp = new Date('2026-08-01T12:00:00.000Z');
    findMany.mockResolvedValue([
      {
        referenceId: 'broadcast-1',
        title: 'Maintenance',
        message: 'The platform will be unavailable tonight.',
        createdAt: new Date('2026-08-02T12:00:00.000Z'),
      },
      {
        referenceId: 'broadcast-1',
        title: 'Maintenance',
        message: 'The platform will be unavailable tonight.',
        createdAt: new Date('2026-08-02T12:00:00.000Z'),
      },
      {
        referenceId: null,
        title: 'Welcome',
        message: 'Welcome to GuroKonekt.',
        createdAt: legacyTimestamp,
      },
      {
        referenceId: null,
        title: 'Welcome',
        message: 'Welcome to GuroKonekt.',
        createdAt: legacyTimestamp,
      },
    ]);

    const result = await service.findAllAnnouncements();

    expect(findMany).toHaveBeenCalledWith({
      where: {
        type: NotificationType.ANNOUNCEMENT,
        status: { not: NotificationStatus.DELETED },
      },
      select: {
        referenceId: true,
        title: true,
        message: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(result.status).toBe(ResponseStatus.Success);
    expect(result.data).toEqual({
      data: [
        {
          id: 'broadcast-1',
          title: 'Maintenance',
          message: 'The platform will be unavailable tonight.',
          recipientCount: 2,
          createdAt: '2026-08-02T12:00:00.000Z',
        },
        {
          id: 'legacy:2026-08-01T12:00:00.000Z:Welcome:Welcome to GuroKonekt.',
          title: 'Welcome',
          message: 'Welcome to GuroKonekt.',
          recipientCount: 2,
          createdAt: '2026-08-01T12:00:00.000Z',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('filters, sorts, and paginates announcement summaries', async () => {
    findMany.mockResolvedValue([
      {
        referenceId: 'broadcast-z',
        title: 'Zebra',
        message: 'Message',
        createdAt: new Date('2026-08-03T12:00:00.000Z'),
      },
      {
        referenceId: 'broadcast-m',
        title: 'Maintenance',
        message: 'Searchable message',
        createdAt: new Date('2026-08-02T12:00:00.000Z'),
      },
      {
        referenceId: 'broadcast-a',
        title: 'Alpha',
        message: 'Message',
        createdAt: new Date('2026-08-01T12:00:00.000Z'),
      },
    ]);

    const result = await service.findAllAnnouncements({
      search: 'maintenance',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-03',
      sortBy: 'title',
      sortOrder: 'asc',
      page: 2,
      limit: 1,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        type: NotificationType.ANNOUNCEMENT,
        status: { not: NotificationStatus.DELETED },
        createdAt: {
          gte: new Date('2026-08-01'),
          lte: new Date('2026-08-03T23:59:59.999Z'),
        },
        OR: [
          { title: { contains: 'maintenance', mode: 'insensitive' } },
          { message: { contains: 'maintenance', mode: 'insensitive' } },
        ],
      },
      select: {
        referenceId: true,
        title: true,
        message: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(result.data).toMatchObject({
      total: 3,
      page: 2,
      limit: 1,
      totalPages: 3,
      data: [{ id: 'broadcast-m', title: 'Maintenance' }],
    });
  });

  it('assigns the same reference ID to every notification in a broadcast', async () => {
    userFindMany.mockResolvedValue([{ id: 'mentor-1' }, { id: 'mentee-1' }]);
    create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: data.userId,
        ...data,
        createdAt: new Date(),
      }),
    );
    transaction.mockImplementation((operations) => Promise.all(operations));

    await service.broadcastAnnouncement({
      title: 'Maintenance',
      message: 'The platform will be unavailable tonight.',
      targetRole: 'all',
    });

    expect(userFindMany).toHaveBeenCalledWith({
      where: {
        role: { in: [UserRole.Mentor, UserRole.Mentee] },
        status: {
          notIn: [UserStatus.Deleted, UserStatus.Banned, UserStatus.Suspended],
        },
      },
      select: { id: true },
    });
    const referenceIds = create.mock.calls.map(
      ([input]) => input.data.referenceId,
    );
    expect(referenceIds).toHaveLength(2);
    expect(new Set(referenceIds).size).toBe(1);
    expect(referenceIds[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
