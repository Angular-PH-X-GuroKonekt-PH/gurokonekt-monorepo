import {
  BookingStatus,
  ResponseStatus,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';

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
