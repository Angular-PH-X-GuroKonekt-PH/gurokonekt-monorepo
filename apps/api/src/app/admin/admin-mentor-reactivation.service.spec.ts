import {
  API_RESPONSE,
  LogsActionType,
  ResponseStatus,
  UserStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AdminMentorService } from './admin-mentor.service';

describe('AdminMentorService mentor reactivation', () => {
  const tx = {
    accountActivationRequest: { update: jest.fn() },
    user: { update: jest.fn() },
    logs: { create: jest.fn() },
  };
  const db = {
    user: { findFirst: jest.fn() },
    accountActivationRequest: { findMany: jest.fn() },
    $transaction: jest.fn<Promise<unknown>, [(t: typeof tx) => unknown]>(async (fn) => fn(tx)),
  };
  const mail = {
    sendMentorReactivationApprovedEmail: jest.fn(),
    sendMentorReactivationRejectedEmail: jest.fn(),
  };
  const service = new AdminMentorService(
    { db } as unknown as PrismaService,
    mail as unknown as MailService,
  );

  const mentor = (isMentorApproved = true) => ({
    id: 'mentor-1',
    firstName: 'Maria',
    email: 'maria@example.com',
    isMentorApproved,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists pending requests with both the leaving and returning reasons', async () => {
    db.accountActivationRequest.findMany.mockResolvedValue([
      {
        reason: 'Ready to mentor again',
        createdAt: new Date('2026-10-30T00:00:00.000Z'),
        user: {
          id: 'mentor-1',
          firstName: 'Maria',
          lastName: 'Santos',
          email: 'maria@example.com',
          deactivatedAt: new Date('2026-10-01T00:00:00.000Z'),
          deactivationFeedback: { reason: 'Taking a break' },
        },
      },
    ]);

    const response = await service.getReactivationRequests();

    expect(response.data).toEqual([
      {
        mentorId: 'mentor-1',
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria@example.com',
        reactivationReason: 'Ready to mentor again',
        deactivationReason: 'Taking a break',
        deactivatedAt: '2026-10-01T00:00:00.000Z',
        requestedAt: '2026-10-30T00:00:00.000Z',
      },
    ]);
  });

  it('approving restores a previously approved mentor and clears the deletion clock', async () => {
    db.user.findFirst.mockResolvedValue(mentor(true));

    const response = await service.approveReactivation('mentor-1', 'admin-1', '127.0.0.1', 'jest');

    expect(response.status).toBe(ResponseStatus.Success);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'mentor-1' },
      data: { status: UserStatus.Approved, deactivatedAt: null, updatedById: 'admin-1' },
    });
    expect(tx.accountActivationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'approved', reviewedById: 'admin-1' }) }),
    );
    expect(tx.logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: LogsActionType.AdminApproveMentorReactivation }),
    });
    expect(mail.sendMentorReactivationApprovedEmail).toHaveBeenCalledWith('maria@example.com', 'Maria');
  });

  it('approving a mentor who was never approved puts them back in the approval queue', async () => {
    db.user.findFirst.mockResolvedValue(mentor(false));

    await service.approveReactivation('mentor-1', 'admin-1', '', '');

    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: UserStatus.PendingApproval }) }),
    );
  });

  it('rejecting keeps the account inactive and emails the reason', async () => {
    db.user.findFirst.mockResolvedValue(mentor());

    const response = await service.rejectReactivation(
      'mentor-1',
      { reason: '  Profile needs updating first.  ' },
      'admin-1',
      '',
      '',
    );

    expect(response.status).toBe(ResponseStatus.Success);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.accountActivationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'rejected', reviewNote: 'Profile needs updating first.' }),
      }),
    );
    expect(mail.sendMentorReactivationRejectedEmail).toHaveBeenCalledWith(
      'maria@example.com',
      'Maria',
      'Profile needs updating first.',
    );
  });

  it('returns 409 when there is no pending request', async () => {
    db.user.findFirst.mockResolvedValue(null);

    const approve = await service.approveReactivation('mentor-1', 'admin-1', '', '');
    const reject = await service.rejectReactivation('mentor-1', { reason: 'x' }, 'admin-1', '', '');

    for (const response of [approve, reject]) {
      expect(response.statusCode).toBe(API_RESPONSE.ERROR.REACTIVATION_REQUEST_NOT_PENDING.code);
    }
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
