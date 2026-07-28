import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  BookingStatus,
  CreateReviewDto,
  GetReviewsQueryDto,
  NotificationInterface,
  NotificationStatus,
  NotificationType,
  ResponseDto,
  ResponseStatus,
  ReviewInterface,
  ReviewListResponseInterface,
  UserRole,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import {
  NOTIFICATION_EVENTS,
  NotificationGateway,
} from '../gateway/notification-gateway.gateway';

/** Mentee summary shape — mirrors BOOKING_USER_SELECT so clients can reuse avatar handling. */
const REVIEW_MENTEE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarAttachments: { select: { publicUrl: true } },
} as const;

/** Every review query selects the same fields so response shapes stay identical. */
const REVIEW_SELECT = {
  id: true,
  bookingId: true,
  userId: true,
  rating: true,
  comment: true,
  createdAt: true,
  booking: { select: { mentorId: true, menteeId: true } },
  user: { select: REVIEW_MENTEE_SELECT },
} as const;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // ====================================================
  // CREATE
  // ====================================================

  async create(
    dto: CreateReviewDto,
    menteeId: string,
  ): Promise<ResponseDto<ReviewInterface>> {
    try {
      const booking = await this.prisma.db.booking.findFirst({
        where: { id: dto.bookingId, isDeleted: false },
        select: { id: true, menteeId: true, mentorId: true, status: true },
      });

      if (!booking) {
        return this.error(API_RESPONSE.ERROR.REVIEW_BOOKING_NOT_FOUND);
      }

      // Only the mentee who attended the session may review it.
      if (booking.menteeId !== menteeId) {
        return this.error(API_RESPONSE.ERROR.REVIEW_ACCESS_DENIED);
      }

      if (booking.status !== BookingStatus.COMPLETED) {
        return this.error(API_RESPONSE.ERROR.REVIEW_BOOKING_NOT_COMPLETED);
      }

      const existing = await this.prisma.db.bookingFeedback.findUnique({
        where: { bookingId_userId: { bookingId: dto.bookingId, userId: menteeId } },
        select: { id: true },
      });

      if (existing) {
        return this.error(API_RESPONSE.ERROR.REVIEW_ALREADY_EXISTS);
      }

      const review = await this.prisma.db.bookingFeedback.create({
        data: {
          bookingId: dto.bookingId,
          userId: menteeId,
          rating: dto.rating,
          comment: this.normalizeComment(dto.comment),
        },
        select: REVIEW_SELECT,
      });

      await this.createNotification(
        booking.mentorId,
        'New Session Review',
        'A mentee left a review for your recent session.',
        NotificationType.SESSION,
        booking.id,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.CREATE_REVIEW.code,
        message: API_RESPONSE.SUCCESS.CREATE_REVIEW.message,
        data: this.mapReview(review),
      };
    } catch (error) {
      // The [bookingId, userId] unique constraint is the authoritative duplicate
      // guard — it catches races between the check above and this write.
      if (error?.code === 'P2002') {
        return this.error(API_RESPONSE.ERROR.REVIEW_ALREADY_EXISTS);
      }

      this.logger.error(error.message, error.stack);
      return this.error(API_RESPONSE.ERROR.CREATE_REVIEW);
    }
  }

  // ====================================================
  // READ
  // ====================================================

  async findReviews(
    query: GetReviewsQueryDto,
    requester: { id: string; role: string },
  ): Promise<ResponseDto<ReviewInterface | ReviewListResponseInterface>> {
    const { bookingId, mentorId } = query;

    // Exactly one filter — supplying both would make the response shape ambiguous.
    if ((!bookingId && !mentorId) || (bookingId && mentorId)) {
      return this.error(API_RESPONSE.ERROR.REVIEW_INVALID_QUERY);
    }

    return bookingId
      ? this.findByBookingId(bookingId, requester)
      : this.findByMentorId(mentorId as string, query);
  }

  /** Returns the mentee's review of one booking. Participants and admins only. */
  private async findByBookingId(
    bookingId: string,
    requester: { id: string; role: string },
  ): Promise<ResponseDto<ReviewInterface>> {
    try {
      const booking = await this.prisma.db.booking.findFirst({
        where: { id: bookingId, isDeleted: false },
        select: { menteeId: true, mentorId: true },
      });

      if (!booking) {
        return this.error(API_RESPONSE.ERROR.REVIEW_BOOKING_NOT_FOUND);
      }

      const isParticipant =
        requester.id === booking.menteeId || requester.id === booking.mentorId;

      if (!isParticipant && requester.role !== UserRole.Admin) {
        return this.error(API_RESPONSE.ERROR.REVIEW_ACCESS_DENIED);
      }

      const review = await this.prisma.db.bookingFeedback.findUnique({
        where: { bookingId_userId: { bookingId, userId: booking.menteeId } },
        select: REVIEW_SELECT,
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_REVIEW.code,
        message: API_RESPONSE.SUCCESS.GET_REVIEW.message,
        data: review ? this.mapReview(review) : null,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return this.error(API_RESPONSE.ERROR.GET_REVIEWS);
    }
  }

  /** Returns a mentor's mentee reviews, newest first, with an average rating. */
  private async findByMentorId(
    mentorId: string,
    query: GetReviewsQueryDto,
  ): Promise<ResponseDto<ReviewListResponseInterface>> {
    try {
      const page = query.page ?? DEFAULT_PAGE;
      const limit = query.limit ?? DEFAULT_LIMIT;
      const where = {
        booking: { mentorId, isDeleted: false },
        userId: { not: mentorId },
      };

      const [rows, summary] = await Promise.all([
        this.prisma.db.bookingFeedback.findMany({
          where,
          select: REVIEW_SELECT,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.db.bookingFeedback.aggregate({
          where,
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

      // rating is INTEGER NOT NULL, so _count.rating already equals a row count
      // over the same predicate — reuse it for both `total` and `ratingCount`
      // instead of running a redundant, non-transactional count() query.
      const total = summary._count.rating;
      const average = summary._avg.rating;

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_REVIEWS.code,
        message: API_RESPONSE.SUCCESS.GET_REVIEWS.message,
        data: {
          data: rows.map(row => this.mapReview(row, { maskLastName: true })),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          averageRating: average === null ? null : Math.round(average * 10) / 10,
          ratingCount: total,
        },
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return this.error(API_RESPONSE.ERROR.GET_REVIEWS);
    }
  }

  // ====================================================
  // HELPERS
  // ====================================================

  /** Builds an error ResponseDto from an API_RESPONSE.ERROR entry. */
  private error<T>(entry: { code: number; message: string }): ResponseDto<T> {
    return {
      status: ResponseStatus.Error,
      statusCode: entry.code,
      message: entry.message,
      data: null,
    };
  }

  /**
   * Flattens a Prisma feedback row into the public review shape.
   *
   * `?mentorId=` is readable by any authenticated user, so passing
   * `maskLastName: true` reduces `mentee.lastName` to an initial (e.g.
   * "Mentee" -> "M.") to avoid exposing the full reviewer roster. The
   * `?bookingId=` branch — restricted to the booking's participants and
   * admins — must never set this option.
   */
  private mapReview(
    row: {
      id: string;
      bookingId: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      booking: { mentorId: string; menteeId: string };
      user: unknown;
    },
    options: { maskLastName?: boolean } = {},
  ): ReviewInterface {
    const mentee = options.maskLastName
      ? this.maskMenteeLastName(row.user as Record<string, unknown>)
      : row.user;

    return {
      id: row.id,
      bookingId: row.bookingId,
      mentorId: row.booking.mentorId,
      menteeId: row.booking.menteeId,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      mentee: mentee as ReviewInterface['mentee'],
    };
  }

  /** Returns a new mentee object with `lastName` reduced to a trailing-period initial. */
  private maskMenteeLastName(
    mentee: Record<string, unknown>,
  ): Record<string, unknown> {
    const lastName = mentee?.['lastName'];
    const trimmed = typeof lastName === 'string' ? lastName.trim() : '';

    return {
      ...mentee,
      lastName: trimmed.length > 0 ? `${trimmed.charAt(0)}.` : '',
    };
  }

  /** Trims a comment and normalizes an empty/whitespace-only value to null. */
  private normalizeComment(comment?: string): string | null {
    const trimmed = comment?.trim();
    return trimmed ? trimmed : null;
  }

  /**
   * Creates an in-app notification and pushes it over the WebSocket gateway.
   * Failures are swallowed so they never block the review write.
   */
  private async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    referenceId?: string,
  ): Promise<void> {
    try {
      const notification = await this.prisma.db.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          status: NotificationStatus.UNREAD,
          referenceId: referenceId ?? null,
        },
      });
      this.notificationGateway.sendNotificationToUser(
        userId,
        notification as unknown as NotificationInterface,
        NOTIFICATION_EVENTS.CREATED,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to create notification for userId=${userId}: ${error.message}`,
      );
    }
  }
}
