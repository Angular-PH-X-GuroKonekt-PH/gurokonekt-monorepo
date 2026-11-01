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
import { EmailDeliveryService } from '../email-delivery/email-delivery.service';
import { BookingService } from './booking.service';

const MENTEE_ID = 'mentee-1';
const MENTOR_ID = 'mentor-1';
const BOOKING_ID = 'booking-1';

/** Fixed "now" so past/future are unambiguous regardless of when tests run. */
const NOW = new Date('2026-08-21T10:00:00.000Z');
const PAST = new Date('2026-08-18T09:00:00.000Z'); // 3 days before NOW
const FUTURE = new Date('2026-08-28T09:00:00.000Z'); // 7 days after NOW
const RESCHEDULED_FUTURE = new Date('2026-08-29T10:30:00.000Z');
const BOOKING_REVISION = new Date('2026-08-20T08:15:00.000Z');

type PrismaMock = {
  db: {
    $transaction: jest.Mock;
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
    emailDelivery: { create: jest.Mock };
  };
};

const createPrismaMock = (): PrismaMock => ({
  db: {
    $transaction: jest.fn(),
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
    emailDelivery: {
      create: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
    },
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
  updatedAt: BOOKING_REVISION,
  mentor: {
    id: MENTOR_ID,
    firstName: 'Alex',
    lastName: 'Mentor',
    avatarAttachments: [],
  },
  mentee: {
    id: MENTEE_ID,
    firstName: 'Jamie',
    lastName: 'Mentee',
    email: 'mentee@example.com',
    timezone: 'Asia/Manila',
    avatarAttachments: [],
  },
  ...overrides,
});

describe('BookingService — backdated bookings (issue #374)', () => {
  let service: BookingService;
  let prisma: PrismaMock;
  let gateway: { sendNotificationToUser: jest.Mock };
  let emailDelivery: {
    sendBookingCreated: jest.Mock;
    sendBookingAccepted: jest.Mock;
    sendBookingRejected: jest.Mock;
    sendBookingRescheduled: jest.Mock;
  };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    prisma = createPrismaMock();
    gateway = { sendNotificationToUser: jest.fn() };
    emailDelivery = {
      sendBookingCreated: jest.fn().mockResolvedValue(undefined),
      sendBookingAccepted: jest.fn().mockResolvedValue(undefined),
      sendBookingRejected: jest.fn().mockResolvedValue(undefined),
      sendBookingRescheduled: jest.fn().mockResolvedValue(undefined),
    };
    prisma.db.$transaction.mockImplementation((callback) =>
      callback(prisma.db),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: gateway },
        { provide: EmailDeliveryService, useValue: emailDelivery },
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

      expect(result.statusCode).toBe(API_RESPONSE.ERROR.BOOKING_NOT_FOUND.code);
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

    it('logs and sends the accepted booking email only to the mentee', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({ sessionDateTime: FUTURE }),
      );
      prisma.db.booking.update.mockImplementation(({ data }) =>
        Promise.resolve(
          buildBooking({
            sessionDateTime: FUTURE,
            menteeNotes: 'Career planning',
            ...data,
          }),
        ),
      );

      const result = await service.approveBooking(BOOKING_ID, MENTOR_ID, {
        sessionLink: 'https://meet.example.com/session-1',
        mentorNotes: 'Please bring your resume',
      });

      expect(result.status).toBe(ResponseStatus.Success);
      expect(prisma.db.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.db.emailDelivery.create).toHaveBeenCalledWith({
        data: {
          eventKey: `booking-approved:${BOOKING_ID}`,
          eventType: 'BOOKING_APPROVED_MENTEE',
          bookingId: BOOKING_ID,
          recipientEmail: 'mentee@example.com',
        },
      });
      expect(emailDelivery.sendBookingAccepted).toHaveBeenCalledWith(
        'delivery-1',
        expect.objectContaining({
          to: 'mentee@example.com',
          menteeFirstName: 'Jamie',
          mentorName: 'Alex Mentor',
          sessionDateTime: FUTURE,
          timeZone: 'Asia/Manila',
          bookingDetails: 'Career planning',
          sessionLink: 'https://meet.example.com/session-1',
        }),
      );
    });
  });

  describe('rejectBooking', () => {
    it('logs and sends the declined booking email only to the mentee', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({
          sessionDateTime: FUTURE,
          menteeNotes: 'Career planning',
        }),
      );
      prisma.db.booking.update.mockImplementation(({ data }) =>
        Promise.resolve(
          buildBooking({
            sessionDateTime: FUTURE,
            menteeNotes: 'Career planning',
            ...data,
          }),
        ),
      );

      const result = await service.rejectBooking(BOOKING_ID, MENTOR_ID, {
        mentorNotes: 'I am unavailable at that time',
      });

      expect(result.status).toBe(ResponseStatus.Success);
      expect(prisma.db.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.db.emailDelivery.create).toHaveBeenCalledWith({
        data: {
          eventKey: `booking-rejected:${BOOKING_ID}`,
          eventType: 'BOOKING_REJECTED_MENTEE',
          bookingId: BOOKING_ID,
          recipientEmail: 'mentee@example.com',
        },
      });
      expect(emailDelivery.sendBookingRejected).toHaveBeenCalledWith(
        'delivery-1',
        expect.objectContaining({
          to: 'mentee@example.com',
          menteeFirstName: 'Jamie',
          mentorName: 'Alex Mentor',
          sessionDateTime: FUTURE,
          timeZone: 'Asia/Manila',
          bookingDetails: 'Career planning',
          declineReason: 'I am unavailable at that time',
        }),
      );
    });
  });

  describe('update', () => {
    it('returns an actionable message when the requested schedule is unavailable', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({ sessionDateTime: FUTURE }),
      );
      prisma.db.user.findUnique.mockResolvedValue({ role: UserRole.Mentor });
      prisma.db.mentorProfile.findUnique.mockResolvedValue({
        availability: [],
        availabilityOverrides: [],
        availabilityTimezone: 'UTC',
        sessionDurationMinutes: 60,
      });

      const result = await service.update(
        BOOKING_ID,
        { sessionDateTime: RESCHEDULED_FUTURE } as never,
        MENTOR_ID,
      );

      expect(result).toMatchObject({
        status: ResponseStatus.Error,
        statusCode: 400,
        message:
          "The selected date and time are outside the mentor's availability. Please choose an available time.",
        data: null,
      });
      expect(prisma.db.booking.update).not.toHaveBeenCalled();
    });

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

    it('logs and emails a mentor schedule change only to the mentee', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({
          sessionDateTime: FUTURE,
          status: BookingStatus.APPROVED,
          menteeNotes: 'Career planning',
        }),
      );
      prisma.db.user.findUnique.mockResolvedValue({ role: UserRole.Mentor });
      prisma.db.booking.update.mockImplementation(({ data }) =>
        Promise.resolve(
          buildBooking({
            sessionDateTime: RESCHEDULED_FUTURE,
            status: BookingStatus.APPROVED,
            menteeNotes: 'Career planning',
            ...data,
          }),
        ),
      );

      const result = await service.update(
        BOOKING_ID,
        { sessionDateTime: RESCHEDULED_FUTURE } as never,
        MENTOR_ID,
      );

      expect(result.status).toBe(ResponseStatus.Success);
      expect(prisma.db.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.db.emailDelivery.create).toHaveBeenCalledWith({
        data: {
          eventKey: `booking-rescheduled:${BOOKING_ID}:${BOOKING_REVISION.toISOString()}`,
          eventType: 'BOOKING_RESCHEDULED_MENTEE',
          bookingId: BOOKING_ID,
          recipientEmail: 'mentee@example.com',
        },
      });
      expect(emailDelivery.sendBookingRescheduled).toHaveBeenCalledWith(
        'delivery-1',
        expect.objectContaining({
          to: 'mentee@example.com',
          menteeFirstName: 'Jamie',
          mentorName: 'Alex Mentor',
          previousSessionDateTime: FUTURE,
          newSessionDateTime: RESCHEDULED_FUTURE,
          timeZone: 'Asia/Manila',
          bookingDetails: 'Career planning',
          bookingStatus: BookingStatus.APPROVED,
        }),
      );
    });

    it('does not create a delivery when the mentor submits the unchanged schedule', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({ sessionDateTime: FUTURE }),
      );
      prisma.db.user.findUnique.mockResolvedValue({ role: UserRole.Mentor });
      prisma.db.booking.update.mockImplementation(({ data }) =>
        Promise.resolve(buildBooking({ sessionDateTime: FUTURE, ...data })),
      );

      const result = await service.update(
        BOOKING_ID,
        { sessionDateTime: FUTURE } as never,
        MENTOR_ID,
      );

      expect(result.status).toBe(ResponseStatus.Success);
      expect(prisma.db.emailDelivery.create).not.toHaveBeenCalled();
      expect(emailDelivery.sendBookingRescheduled).not.toHaveBeenCalled();
    });

    it('does not create a delivery for an unrelated mentor update', async () => {
      prisma.db.booking.findUnique.mockResolvedValue(
        buildBooking({ sessionDateTime: FUTURE }),
      );
      prisma.db.user.findUnique.mockResolvedValue({ role: UserRole.Mentor });
      prisma.db.booking.update.mockImplementation(({ data }) =>
        Promise.resolve(buildBooking({ sessionDateTime: FUTURE, ...data })),
      );

      const result = await service.update(
        BOOKING_ID,
        { mentorNotes: 'Please bring your resume' },
        MENTOR_ID,
      );

      expect(result.status).toBe(ResponseStatus.Success);
      expect(prisma.db.emailDelivery.create).not.toHaveBeenCalled();
      expect(emailDelivery.sendBookingRescheduled).not.toHaveBeenCalled();
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

    it('creates a delivery log atomically and immediately emails only the booked mentor', async () => {
      prisma.db.user.findUnique.mockResolvedValue({
        role: UserRole.Mentor,
        status: UserStatus.Approved,
        isMentorApproved: true,
        isMentorProfileComplete: true,
        email: 'mentor@example.com',
        firstName: 'Alex',
        timezone: 'Asia/Manila',
        mentorProfiles: [{ sessionDurationMinutes: 60 }],
      });
      prisma.db.booking.create.mockResolvedValue(
        buildBooking({
          sessionDateTime: FUTURE,
          menteeNotes: 'Career planning',
          mentor: { id: MENTOR_ID, firstName: 'Alex', lastName: 'Mentor' },
          mentee: { id: MENTEE_ID, firstName: 'Jamie', lastName: 'Mentee' },
        }),
      );
      prisma.db.emailDelivery.create.mockResolvedValue({ id: 'delivery-1' });

      const result = await service.create(
        {
          mentorId: MENTOR_ID,
          sessionDateTime: FUTURE.toISOString(),
          menteeNotes: 'Career planning',
        } as never,
        MENTEE_ID,
      );

      expect(result.status).toBe(ResponseStatus.Success);
      expect(prisma.db.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.db.emailDelivery.create).toHaveBeenCalledWith({
        data: {
          eventKey: `booking-created:${BOOKING_ID}`,
          eventType: 'BOOKING_CREATED_MENTOR',
          bookingId: BOOKING_ID,
          recipientEmail: 'mentor@example.com',
        },
      });
      expect(emailDelivery.sendBookingCreated).toHaveBeenCalledWith(
        'delivery-1',
        expect.objectContaining({
          to: 'mentor@example.com',
          mentorFirstName: 'Alex',
          menteeName: 'Jamie Mentee',
          sessionDateTime: FUTURE,
          timeZone: 'Asia/Manila',
          durationMinutes: 60,
          bookingDetails: 'Career planning',
        }),
      );
    });
  });
});
