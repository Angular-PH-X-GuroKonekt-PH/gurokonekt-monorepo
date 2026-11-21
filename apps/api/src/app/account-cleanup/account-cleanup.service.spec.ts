import { LogsActionType, UserStatus } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { ACCOUNT_DELETION_AFTER_DAYS, AccountCleanupService } from './account-cleanup.service';

describe('AccountCleanupService', () => {
  const NOW = new Date('2026-10-31T00:00:00.000Z');
  const db = {
    user: { findMany: jest.fn(), updateMany: jest.fn() },
    logs: { create: jest.fn() },
  };
  const service = new AccountCleanupService({ db } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    db.logs.create.mockResolvedValue({});
  });

  it('only targets self-deactivated accounts past the cutoff with no pending request', async () => {
    db.user.findMany.mockResolvedValue([]);

    await service.deleteExpiredDeactivatedAccounts(NOW);

    const cutoff = new Date(NOW.getTime() - ACCOUNT_DELETION_AFTER_DAYS * 24 * 60 * 60 * 1000);
    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: UserStatus.Inactive,
          deactivatedAt: { not: null, lte: cutoff },
          NOT: { activationRequest: { is: { status: 'pending' } } },
        },
      }),
    );
  });

  it('marks expired accounts deleted and writes an audit log for each', async () => {
    db.user.findMany.mockResolvedValue([
      { id: 'u1', role: 'mentee', deactivatedAt: new Date('2026-09-01T00:00:00.000Z') },
      { id: 'u2', role: 'mentor', deactivatedAt: new Date('2026-09-15T00:00:00.000Z') },
    ]);
    db.user.updateMany.mockResolvedValue({ count: 1 });

    const deleted = await service.deleteExpiredDeactivatedAccounts(NOW);

    expect(deleted).toBe(2);
    expect(db.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'u1', status: UserStatus.Inactive }),
        data: { status: UserStatus.Deleted },
      }),
    );
    expect(db.logs.create).toHaveBeenCalledTimes(2);
    expect(db.logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: LogsActionType.AccountAutoDeleted, targetId: 'u1' }),
    });
  });

  it('skips an account that reactivated between the read and the update', async () => {
    db.user.findMany.mockResolvedValue([{ id: 'u1', role: 'mentee', deactivatedAt: new Date('2026-09-01') }]);
    db.user.updateMany.mockResolvedValue({ count: 0 });

    const deleted = await service.deleteExpiredDeactivatedAccounts(NOW);

    expect(deleted).toBe(0);
    expect(db.logs.create).not.toHaveBeenCalled();
  });

  it('never throws when the database fails', async () => {
    db.user.findMany.mockRejectedValue(new Error('db down'));

    await expect(service.deleteExpiredDeactivatedAccounts(NOW)).resolves.toBe(0);
  });
});
