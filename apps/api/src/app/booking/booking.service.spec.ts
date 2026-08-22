import { Test, TestingModule } from '@nestjs/testing';
import {
  API_RESPONSE,
  BookingStatus,
  ResponseStatus,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../gateway/notification-gateway.gateway';
import { BookingService } from './booking.service';

const MENTEE_ID = 'mentee-1';
const MENTOR_ID = 'mentor-1';
const BOOKING_ID = 'booking-1';

/** Fixed "now" so past/future are unambiguous regardless of when tests run. */
const NOW = new Date('2026-08-21T10:00:00.000Z');
const PAST = new Date('2026-08-18T09:00:00.000Z'); // 3 days before NOW
const FUTURE = new Date('2026-08-28T09:00:00.000Z'); // 7 days after NOW

type PrismaMock = {
  db: {
    user: { findUnique: jest.Mock; findMany: jest.Mock };
    booking: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    mentorProfile: { findUnique: jest.Mock };
    notification: { create: jest.Mock };
  };
};

const createPrismaMock = (): PrismaMock => ({
  db: {
    user: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    mentorProfile: { findUnique: jest.fn().mockResolvedValue(null) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notif-1' }) },
  },
});

const buildBooking = (overrides = {}) => ({
  id: BOOKING_ID,
  menteeId: MENTEE_ID,
  mentorId: MENTOR_ID,
  sessionDateTime: PAST,
  status: BookingStatus.PENDING,
  isDeleted: false,
  sessionLink: null,
  mentorNotes: null,
  menteeNotes: null,
  ...overrides,
});

describe('BookingService — backdated bookings (issue #374)', () => {
  let service: BookingService;
  let prisma: PrismaMock;
  let gateway: { sendNotificationToUser: jest.Mock };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    prisma = createPrismaMock();
    gateway = { sendNotificationToUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('approveBooking', () => {
    it('rejects approval of a backdated pending booking', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(buildBooking());
      prisma.db.booking.update.mockImplementation(({ data }) =>
        Promise.resolve(buildBooking(data)),
      );

      const result = await service.approveBooking(BOOKING_ID, MENTOR_ID, {
        sessionLink: 'https://meet.test/abc',
      });

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.BOOKING_BACKDATED_NOT_ACTIONABLE.code,
      );
      expect(prisma.db.booking.update).not.toHaveBeenCalled();
    });

    it('still approves a pending booking in the future', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({ sessionDateTime: FUTURE }),
      );
      prisma.db.booking.update.mockImplementation(({ data }) =>
        Promise.resolve(buildBooking({ sessionDateTime: FUTURE, ...data })),
      );

      const result = await service.approveBooking(BOOKING_ID, MENTOR_ID, {
        sessionLink: 'https://meet.test/abc',
      });

      expect(result.status).toBe(ResponseStatus.Success);
      expect(result.statusCode).toBe(API_RESPONSE.SUCCESS.APPROVE_BOOKING.code);
    });

    it('rejects approval that reschedules the session into the past', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({ sessionDateTime: FUTURE }),
      );

      const result = await service.approveBooking(BOOKING_ID, MENTOR_ID, {
        sessionLink: 'https://meet.test/abc',
        sessionDateTime: PAST.toISOString(),
      } as never);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.BOOKING_SESSION_IN_PAST.code,
      );
      expect(prisma.db.booking.update).not.toHaveBeenCalled();
    });

    it('reports not-found before the backdate check for a missing booking', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(null);

      const result = await service.approveBooking(BOOKING_ID, MENTOR_ID, {
        sessionLink: 'https://meet.test/abc',
      });

      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.BOOKING_NOT_FOUND.code,
      );
    });

    it('denies a mentor approving a booking that is not theirs', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(buildBooking());

      const result = await service.approveBooking(BOOKING_ID, 'other-mentor', {
        sessionLink: 'https://meet.test/abc',
      });

      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
      );
    });
  });

  describe('update', () => {
    it('rejects rescheduling a booking into the past', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({ sessionDateTime: FUTURE }),
      );
      prisma.db.user.findUnique.mockResolvedValue({ role: UserRole.Mentor });

      const result = await service.update(
        BOOKING_ID,
        { sessionDateTime: PAST.toISOString() } as never,
        MENTOR_ID,
      );

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.BOOKING_SESSION_IN_PAST.code,
      );
      expect(prisma.db.booking.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('rejects creating a booking in the past', async () => {
      prisma.db.user.findUnique.mockResolvedValue({
        role: UserRole.Mentor,
        status: UserStatus.Approved,
        isMentorApproved: true,
        isMentorProfileComplete: true,
      });
      prisma.db.booking.create.mockResolvedValue(buildBooking());

      const result = await service.create(
        {
          mentorId: MENTOR_ID,
          sessionDateTime: PAST.toISOString(),
        } as never,
        MENTEE_ID,
      );

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.BOOKING_SESSION_IN_PAST.code,
      );
      expect(prisma.db.booking.create).not.toHaveBeenCalled();
    });
  });
});
