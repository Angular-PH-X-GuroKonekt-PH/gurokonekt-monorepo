import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  BookingStatus,
  CreateReviewDto,
  NotificationInterface,
  NotificationStatus,
  NotificationType,
  ResponseDto,
  ResponseStatus,
  ReviewInterface,
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
          comment: dto.comment ?? null,
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

  /** Flattens a Prisma feedback row into the public review shape. */
  private mapReview(row: {
    id: string;
    bookingId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    booking: { mentorId: string; menteeId: string };
    user: unknown;
  }): ReviewInterface {
    return {
      id: row.id,
      bookingId: row.bookingId,
      mentorId: row.booking.mentorId,
      menteeId: row.booking.menteeId,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      mentee: row.user as ReviewInterface['mentee'],
    };
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
