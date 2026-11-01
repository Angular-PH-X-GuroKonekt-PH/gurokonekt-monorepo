import { API_RESPONSE, LogsActionType, ResponseStatus } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { AdminNotificationRecipientsService } from './admin-notification-recipients.service';

describe('AdminNotificationRecipientsService', () => {
  const createdAt = new Date('2026-10-29T00:00:00.000Z');
  const tx = {
    adminNotificationRecipient: { create: jest.fn(), delete: jest.fn() },
    logs: { create: jest.fn() },
  };
  const db = {
    adminNotificationRecipient: { findMany: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn<Promise<unknown>, [(t: typeof tx) => unknown]>(async (fn) => fn(tx)),
  };
  const service = new AdminNotificationRecipientsService({ db } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists recipients oldest first', async () => {
    db.adminNotificationRecipient.findMany.mockResolvedValue([
      { id: 'r1', email: 'admin@example.com', createdAt },
    ]);

    const response = await service.getRecipients();

    expect(db.adminNotificationRecipient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
    );
    expect(response.status).toBe(ResponseStatus.Success);
    expect(response.data).toEqual([
      { id: 'r1', email: 'admin@example.com', createdAt: createdAt.toISOString() },
    ]);
  });

  it('adds a normalized email and writes an audit log', async () => {
    tx.adminNotificationRecipient.create.mockResolvedValue({
      id: 'r1',
      email: 'admin@example.com',
      createdAt,
    });

    const response = await service.addRecipient(
      { email: '  Admin@Example.com ' },
      'admin-1',
      '127.0.0.1',
      'Jest',
    );

    expect(tx.adminNotificationRecipient.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { email: 'admin@example.com', createdById: 'admin-1' } }),
    );
    expect(tx.logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: LogsActionType.AdminAddNotificationRecipient,
        targetId: 'r1',
        createdById: 'admin-1',
      }),
    });
    expect(response.statusCode).toBe(API_RESPONSE.SUCCESS.ADMIN_ADD_NOTIFICATION_RECIPIENT.code);
  });

  it('returns 409 when the email is already on the list', async () => {
    db.$transaction.mockRejectedValueOnce({ code: 'P2002' });

    const response = await service.addRecipient({ email: 'admin@example.com' }, 'admin-1', '', '');

    expect(response.status).toBe(ResponseStatus.Error);
    expect(response.statusCode).toBe(API_RESPONSE.ERROR.NOTIFICATION_RECIPIENT_ALREADY_EXISTS.code);
  });

  it('removes a recipient and writes an audit log', async () => {
    db.adminNotificationRecipient.findUnique.mockResolvedValue({ id: 'r1', email: 'admin@example.com' });

    const response = await service.removeRecipient('r1', 'admin-1', '127.0.0.1', 'Jest');

    expect(tx.adminNotificationRecipient.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    expect(tx.logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actionType: LogsActionType.AdminRemoveNotificationRecipient,
        metadata: { email: 'admin@example.com' },
      }),
    });
    expect(response.status).toBe(ResponseStatus.Success);
  });

  it('returns 404 when removing an unknown recipient', async () => {
    db.adminNotificationRecipient.findUnique.mockResolvedValue(null);

    const response = await service.removeRecipient('missing', 'admin-1', '', '');

    expect(response.statusCode).toBe(API_RESPONSE.ERROR.NOTIFICATION_RECIPIENT_NOT_FOUND.code);
    expect(tx.adminNotificationRecipient.delete).not.toHaveBeenCalled();
  });
});
