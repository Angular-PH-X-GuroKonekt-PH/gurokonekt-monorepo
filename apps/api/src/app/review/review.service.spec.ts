import { Test, TestingModule } from '@nestjs/testing';
import {
  API_RESPONSE,
  BookingStatus,
  ResponseStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../gateway/notification-gateway.gateway';
import { ReviewService } from './review.service';

const MENTEE_ID = 'mentee-1';
const MENTOR_ID = 'mentor-1';
const BOOKING_ID = 'booking-1';

type PrismaMock = {
  db: {
    booking: { findFirst: jest.Mock };
    bookingFeedback: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
      create: jest.Mock;
    };
    notification: { create: jest.Mock };
  };
};

const createPrismaMock = (): PrismaMock => ({
  db: {
    booking: { findFirst: jest.fn() },
    bookingFeedback: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    notification: { create: jest.fn() },
  },
});

const buildBooking = (overrides = {}) => ({
  id: BOOKING_ID,
  menteeId: MENTEE_ID,
  mentorId: MENTOR_ID,
  status: BookingStatus.COMPLETED,
  ...overrides,
});

const buildReviewRow = (overrides = {}) => ({
  id: 'review-1',
  bookingId: BOOKING_ID,
  userId: MENTEE_ID,
  rating: 5,
  comment: 'Great session',
  createdAt: new Date('2026-07-20T10:00:00.000Z'),
  booking: { mentorId: MENTOR_ID, menteeId: MENTEE_ID },
  user: {
    id: MENTEE_ID,
    firstName: 'Mia',
    lastName: 'Mentee',
    avatarAttachments: [{ publicUrl: 'https://cdn.test/mia.png' }],
  },
  ...overrides,
});

describe('ReviewService', () => {
  let service: ReviewService;
  let prisma: PrismaMock;
  let gateway: { sendNotificationToUser: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    gateway = { sendNotificationToUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  describe('create', () => {
    it('creates the review and notifies the mentor', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());
      prisma.db.bookingFeedback.findUnique.mockResolvedValue(null);
      prisma.db.bookingFeedback.create.mockResolvedValue(buildReviewRow());
      prisma.db.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.create(
        { bookingId: BOOKING_ID, rating: 5, comment: 'Great session' },
        MENTEE_ID,
      );

      expect(result.status).toBe(ResponseStatus.Success);
      expect(result.statusCode).toBe(API_RESPONSE.SUCCESS.CREATE_REVIEW.code);
      expect(result.data).toEqual({
        id: 'review-1',
        bookingId: BOOKING_ID,
        mentorId: MENTOR_ID,
        menteeId: MENTEE_ID,
        rating: 5,
        comment: 'Great session',
        createdAt: '2026-07-20T10:00:00.000Z',
        mentee: {
          id: MENTEE_ID,
          firstName: 'Mia',
          lastName: 'Mentee',
          avatarAttachments: [{ publicUrl: 'https://cdn.test/mia.png' }],
        },
      });
      expect(prisma.db.bookingFeedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bookingId: BOOKING_ID, userId: MENTEE_ID, rating: 5, comment: 'Great session' },
        }),
      );
      expect(prisma.db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: MENTOR_ID, referenceId: BOOKING_ID }),
        }),
      );
    });

    it('stores a null comment when none is supplied', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());
      prisma.db.bookingFeedback.findUnique.mockResolvedValue(null);
      prisma.db.bookingFeedback.create.mockResolvedValue(buildReviewRow({ comment: null }));
      prisma.db.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await service.create({ bookingId: BOOKING_ID, rating: 4 }, MENTEE_ID);

      expect(result.status).toBe(ResponseStatus.Success);
      expect(prisma.db.bookingFeedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bookingId: BOOKING_ID, userId: MENTEE_ID, rating: 4, comment: null },
        }),
      );
    });

    it('returns 404 when the booking does not exist or is soft-deleted', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(null);

      const result = await service.create({ bookingId: BOOKING_ID, rating: 5 }, MENTEE_ID);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_BOOKING_NOT_FOUND.code);
      expect(prisma.db.bookingFeedback.create).not.toHaveBeenCalled();
    });

    it('returns 403 when the requester is not the booking mentee', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());

      const result = await service.create({ bookingId: BOOKING_ID, rating: 5 }, MENTOR_ID);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_ACCESS_DENIED.code);
      expect(prisma.db.bookingFeedback.create).not.toHaveBeenCalled();
    });

    it('returns 400 when the booking is not completed', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(
        buildBooking({ status: BookingStatus.APPROVED }),
      );

      const result = await service.create({ bookingId: BOOKING_ID, rating: 5 }, MENTEE_ID);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_BOOKING_NOT_COMPLETED.code);
      expect(prisma.db.bookingFeedback.create).not.toHaveBeenCalled();
    });

    it('returns 409 when a review already exists for the booking', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());
      prisma.db.bookingFeedback.findUnique.mockResolvedValue({ id: 'review-1' });

      const result = await service.create({ bookingId: BOOKING_ID, rating: 5 }, MENTEE_ID);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_ALREADY_EXISTS.code);
      expect(prisma.db.bookingFeedback.create).not.toHaveBeenCalled();
    });

    it('maps a P2002 unique violation to 409', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());
      prisma.db.bookingFeedback.findUnique.mockResolvedValue(null);
      prisma.db.bookingFeedback.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      const result = await service.create({ bookingId: BOOKING_ID, rating: 5 }, MENTEE_ID);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_ALREADY_EXISTS.code);
    });

    it('still succeeds when the notification fails', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());
      prisma.db.bookingFeedback.findUnique.mockResolvedValue(null);
      prisma.db.bookingFeedback.create.mockResolvedValue(buildReviewRow());
      prisma.db.notification.create.mockRejectedValue(new Error('socket down'));

      const result = await service.create({ bookingId: BOOKING_ID, rating: 5 }, MENTEE_ID);

      expect(result.status).toBe(ResponseStatus.Success);
      expect(result.statusCode).toBe(API_RESPONSE.SUCCESS.CREATE_REVIEW.code);
    });

    it('returns 500 when the database write fails unexpectedly', async () => {
      prisma.db.booking.findFirst.mockRejectedValue(new Error('db down'));

      const result = await service.create({ bookingId: BOOKING_ID, rating: 5 }, MENTEE_ID);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.CREATE_REVIEW.code);
    });
  });

  describe('findReviews', () => {
    const menteeRequester = { id: MENTEE_ID, role: 'mentee' };
    const mentorRequester = { id: MENTOR_ID, role: 'mentor' };
    const adminRequester = { id: 'admin-1', role: 'admin' };
    const strangerRequester = { id: 'someone-else', role: 'mentee' };

    it('returns 400 when neither bookingId nor mentorId is supplied', async () => {
      const result = await service.findReviews({}, menteeRequester);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_INVALID_QUERY.code);
    });

    it('returns 400 when both bookingId and mentorId are supplied', async () => {
      const result = await service.findReviews(
        { bookingId: BOOKING_ID, mentorId: MENTOR_ID },
        menteeRequester,
      );

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_INVALID_QUERY.code);
    });

    it('returns the review for the booking mentee', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());
      prisma.db.bookingFeedback.findUnique.mockResolvedValue(buildReviewRow());

      const result = await service.findReviews({ bookingId: BOOKING_ID }, menteeRequester);

      expect(result.status).toBe(ResponseStatus.Success);
      expect(result.statusCode).toBe(API_RESPONSE.SUCCESS.GET_REVIEW.code);
      expect(result.data).toEqual(
        expect.objectContaining({ id: 'review-1', mentorId: MENTOR_ID, menteeId: MENTEE_ID }),
      );
    });

    it('returns the review for the booking mentor and for an admin', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());
      prisma.db.bookingFeedback.findUnique.mockResolvedValue(buildReviewRow());

      const mentorResult = await service.findReviews({ bookingId: BOOKING_ID }, mentorRequester);
      const adminResult = await service.findReviews({ bookingId: BOOKING_ID }, adminRequester);

      expect(mentorResult.status).toBe(ResponseStatus.Success);
      expect(adminResult.status).toBe(ResponseStatus.Success);
    });

    it('returns 403 when an unrelated user asks for a booking review', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());

      const result = await service.findReviews({ bookingId: BOOKING_ID }, strangerRequester);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_ACCESS_DENIED.code);
      expect(prisma.db.bookingFeedback.findUnique).not.toHaveBeenCalled();
    });

    it('returns 404 when the booking does not exist', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(null);

      const result = await service.findReviews({ bookingId: BOOKING_ID }, menteeRequester);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.REVIEW_BOOKING_NOT_FOUND.code);
    });

    it('returns null data when the booking has no review yet', async () => {
      prisma.db.booking.findFirst.mockResolvedValue(buildBooking());
      prisma.db.bookingFeedback.findUnique.mockResolvedValue(null);

      const result = await service.findReviews({ bookingId: BOOKING_ID }, menteeRequester);

      expect(result.status).toBe(ResponseStatus.Success);
      expect(result.data).toBeNull();
    });

    it('returns a paginated mentor review list with aggregates', async () => {
      prisma.db.bookingFeedback.findMany.mockResolvedValue([buildReviewRow()]);
      prisma.db.bookingFeedback.count.mockResolvedValue(42);
      prisma.db.bookingFeedback.aggregate.mockResolvedValue({
        _avg: { rating: 4.5666 },
        _count: { rating: 42 },
      });

      const result = await service.findReviews(
        { mentorId: MENTOR_ID, page: 2, limit: 20 },
        strangerRequester,
      );

      expect(result.status).toBe(ResponseStatus.Success);
      expect(result.statusCode).toBe(API_RESPONSE.SUCCESS.GET_REVIEWS.code);
      expect(result.data).toEqual({
        data: [expect.objectContaining({ id: 'review-1' })],
        total: 42,
        page: 2,
        limit: 20,
        totalPages: 3,
        averageRating: 4.6,
        ratingCount: 42,
      });
      expect(prisma.db.bookingFeedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            booking: { mentorId: MENTOR_ID, isDeleted: false },
            user: { role: 'mentee' },
          },
          orderBy: { createdAt: 'desc' },
          skip: 20,
          take: 20,
        }),
      );
    });

    it('defaults to page 1 and limit 20', async () => {
      prisma.db.bookingFeedback.findMany.mockResolvedValue([]);
      prisma.db.bookingFeedback.count.mockResolvedValue(0);
      prisma.db.bookingFeedback.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });

      const result = await service.findReviews({ mentorId: MENTOR_ID }, strangerRequester);

      expect(result.data).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        averageRating: null,
        ratingCount: 0,
      });
      expect(prisma.db.bookingFeedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('returns 500 when the query fails unexpectedly', async () => {
      prisma.db.bookingFeedback.findMany.mockRejectedValue(new Error('db down'));
      prisma.db.bookingFeedback.count.mockResolvedValue(0);
      prisma.db.bookingFeedback.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });

      const result = await service.findReviews({ mentorId: MENTOR_ID }, strangerRequester);

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.GET_REVIEWS.code);
    });
  });
});
