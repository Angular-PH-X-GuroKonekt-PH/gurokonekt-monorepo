import {
  API_RESPONSE,
  BookingStatus,
  ResponseStatus,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';

import bcrypt from 'bcrypt';

import { UserService } from './user.service';

const NOW = new Date('2026-09-13T04:00:00.000Z');

describe('UserService.getMentorDashboard', () => {
  let service: UserService;
  let prisma: {
    db: {
      user: { findUnique: jest.Mock };
      booking: { count: jest.Mock; findFirst: jest.Mock };
      logs: { create: jest.Mock };
    };
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    prisma = {
      db: {
        user: { findUnique: jest.fn() },
        booking: { count: jest.fn(), findFirst: jest.fn() },
        logs: { create: jest.fn().mockResolvedValue({}) },
      },
    };
    service = new UserService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns database-wide stats and the nearest future approved session', async () => {
    prisma.db.user.findUnique.mockResolvedValue({
      id: 'mentor-1',
      firstName: 'Maria',
      role: UserRole.Mentor,
      status: UserStatus.Approved,
      isMentorApproved: true,
      isMentorProfileComplete: true,
    });
    prisma.db.booking.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4);
    prisma.db.booking.findFirst.mockResolvedValue({
      sessionDateTime: new Date('2026-09-14T02:00:00.000Z'),
      sessionLink: 'https://meet.example/session',
      menteeNotes: 'Angular mentoring',
      mentee: { firstName: 'Juan', lastName: 'Dela Cruz' },
    });

    const result = await service.getMentorDashboard(
      'mentor-1',
      '127.0.0.1',
      'test-agent',
    );

    expect(result.status).toBe(ResponseStatus.Success);
    expect(result.data).toMatchObject({
      quickStats: {
        pendingBookingRequestsCount: 2,
        upcomingSessions: 1,
        totalCompletedSessions: 4,
      },
      nextUpcomingSession: {
        title: 'Angular mentoring',
        menteeName: 'Juan Dela Cruz',
        sessionDateTime: '2026-09-14T02:00:00.000Z',
        sessionLink: 'https://meet.example/session',
      },
    });
    expect(prisma.db.booking.count).toHaveBeenNthCalledWith(2, {
      where: {
        mentorId: 'mentor-1',
        status: BookingStatus.APPROVED,
        sessionDateTime: { gte: NOW },
        isDeleted: false,
      },
    });
    expect(prisma.db.booking.findFirst).toHaveBeenCalledWith({
      where: {
        mentorId: 'mentor-1',
        status: BookingStatus.APPROVED,
        sessionDateTime: { gte: NOW },
        isDeleted: false,
      },
      orderBy: { sessionDateTime: 'asc' },
      select: expect.any(Object),
    });
  });

  it('returns zero and no preview when there is no future approved session', async () => {
    prisma.db.user.findUnique.mockResolvedValue({
      id: 'mentor-1',
      firstName: 'Maria',
      role: UserRole.Mentor,
      status: UserStatus.Approved,
      isMentorApproved: true,
      isMentorProfileComplete: true,
    });
    prisma.db.booking.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3);
    prisma.db.booking.findFirst.mockResolvedValue(null);

    const result = await service.getMentorDashboard(
      'mentor-1',
      '127.0.0.1',
      'test-agent',
    );

    expect(result.data).toMatchObject({
      quickStats: { upcomingSessions: 0 },
      nextUpcomingSession: null,
    });
  });
});

describe('UserService.downgradeMentorToMentee wrong password', () => {
  it('returns 400, not 401, so the web app does not log the user out (issue #80)', async () => {
    const prisma = {
      db: {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'mentor-1',
            email: 'mentor@example.com',
            firstName: 'Maria',
            role: UserRole.Mentor,
            hashPassword: bcrypt.hashSync('right-password', 4),
          }),
        },
        $transaction: jest.fn(),
      },
    };
    const service = new UserService(prisma as never, {} as never, {} as never, {} as never);

    const response = await service.downgradeMentorToMentee(
      'mentor-1',
      { password: 'wrong-password' } as never,
      '127.0.0.1',
      'Jest',
      'http://localhost:4200',
    );

    expect(response.status).toBe(ResponseStatus.Error);
    expect(response.statusCode).toBe(400);
    expect(response.message).toBe(API_RESPONSE.ERROR.PASSWORD_INCORRECT.message);
    expect(prisma.db.$transaction).not.toHaveBeenCalled();
  });
});

describe('UserService deactivation lifecycle', () => {
  const tx = {
    deactivationFeedback: { upsert: jest.fn() },
    user: { update: jest.fn() },
  };
  const prisma = {
    db: {
      user: { findFirst: jest.fn() },
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
      logs: { create: jest.fn() },
      accountActivationRequest: { findUnique: jest.fn() },
    },
  };
  const service = new UserService(prisma as never, {} as never, {} as never, {} as never);

  beforeEach(() => jest.clearAllMocks());

  it('records when the user deactivated, which starts the 30-day deletion clock', async () => {
    prisma.db.user.findFirst.mockResolvedValue({
      id: 'user-1',
      deactivationTokenExpiresAt: new Date(Date.now() + 60_000),
    });

    const response = await service.submitDeactivationFeedback(
      'user-1',
      { token: 'tok', reason: 'Taking a break' } as never,
      '127.0.0.1',
      'Jest',
    );

    expect(response.status).toBe(ResponseStatus.Success);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({ status: UserStatus.Inactive, deactivatedAt: expect.any(Date) }),
    });
  });

  it("returns the user's activation request so the page can show its status", async () => {
    const request = { status: 'pending', reason: 'Back', reviewNote: null, createdAt: new Date(), reviewedAt: null };
    prisma.db.accountActivationRequest.findUnique.mockResolvedValue(request);

    const response = await service.getActivationRequest('user-1', 'user-1');

    expect(response.data).toBe(request);
  });

  it("refuses to show another user's activation request", async () => {
    const response = await service.getActivationRequest('user-1', 'someone-else');

    expect(response.statusCode).toBe(403);
    expect(prisma.db.accountActivationRequest.findUnique).not.toHaveBeenCalled();
  });
});
