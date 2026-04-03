import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  API_RESPONSE,
  ApproveBookingDto,
  BookingInterface,
  BookingStatus,
  CreateBookingDto,
  MentorBookingsQueryDto,
  NotificationStatus,
  NotificationType,
  NotificationInterface,
  ResponseDto,
  ResponseStatus,
  UpdateBookingDto,
  UserRole,
} from '@gurokonekt/models';
import {
  NOTIFICATION_EVENTS,
  NotificationGateway,
} from '../gateway/notification-gateway.gateway';

/** Fields selected for mentor/mentee when returning a booking list entry. */
const BOOKING_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarAttachments: {
    select: { publicUrl: true },
  },
} as const;

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // ====================================================
  // CREATE
  // ====================================================

  async create(
    dto: CreateBookingDto,
    menteeId: string,
  ): Promise<ResponseDto<BookingInterface>> {
    try {
      const conflict = await this.checkBookingConflict(dto.mentorId, new Date(dto.sessionDateTime));
      if (conflict) return conflict as ResponseDto<BookingInterface>;

      const booking = await this.prisma.db.booking.create({
        data: {
          menteeId,
          mentorId: dto.mentorId,
          sessionDateTime: dto.sessionDateTime,
          notes: dto.notes ?? null,
          status: BookingStatus.PENDING,
        },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      // Notify mentor — new booking request
      await this.createNotification(
        dto.mentorId,
        'New Booking Request',
        `You have received a new booking request for ${new Date(dto.sessionDateTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`,
        NotificationType.BOOKING,
        booking.id,
      );

      // Notify mentee — booking pending confirmation
      await this.createNotification(
        menteeId,
        'Booking Request Submitted',
        'Your booking request has been submitted and is pending mentor approval.',
        NotificationType.BOOKING,
        booking.id,
      );

      // Notify all admins — new booking created
      await this.notifyAllAdmins(
        'New Booking Request',
        `A new session booking has been created between a mentee and mentor. Booking ID: ${booking.id}`,
        NotificationType.BOOKING,
        booking.id,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.CREATE_BOOKING.code,
        message: API_RESPONSE.SUCCESS.CREATE_BOOKING.message,
        data: booking as unknown as BookingInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.CREATE_BOOKING.code,
        message: API_RESPONSE.ERROR.CREATE_BOOKING.message,
        data: null,
      };
    }
  }

  // ====================================================
  // GET ALL
  // ====================================================

  async findAll(): Promise<ResponseDto<BookingInterface[]>> {
    try {
      const bookings = await this.prisma.db.booking.findMany({
        where: { isDeleted: false },
        orderBy: { sessionDateTime: 'asc' },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_BOOKINGS.code,
        message: API_RESPONSE.SUCCESS.GET_BOOKINGS.message,
        data: bookings as unknown as BookingInterface[],
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_BOOKINGS.code,
        message: API_RESPONSE.ERROR.GET_BOOKINGS.message,
        data: null,
      };
    }
  }

  // ====================================================
  // GET BY ID
  // ====================================================

  async findById(
    id: string,
    authenticatedUserId: string,
  ): Promise<ResponseDto<BookingInterface>> {
    try {
      const booking = await this.prisma.db.booking.findUnique({
        where: { id },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      if (!booking || booking.isDeleted) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.message,
          data: null,
        };
      }

      const isAdmin = await this.checkIsAdmin(authenticatedUserId);
      const isParticipant =
        booking.menteeId === authenticatedUserId ||
        booking.mentorId === authenticatedUserId;

      if (!isAdmin && !isParticipant) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.message,
          data: null,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_BOOKING.code,
        message: API_RESPONSE.SUCCESS.GET_BOOKING.message,
        data: booking as unknown as BookingInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_BOOKING.code,
        message: API_RESPONSE.ERROR.GET_BOOKING.message,
        data: null,
      };
    }
  }

  // ====================================================
  // GET BY USER ID
  // ====================================================

  async findByUserId(
    userId: string,
    authenticatedUserId: string,
  ): Promise<ResponseDto<BookingInterface[]>> {
    try {
      const isAdmin = await this.checkIsAdmin(authenticatedUserId);

      if (!isAdmin && userId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.message,
          data: null,
        };
      }

      const bookings = await this.prisma.db.booking.findMany({
        where: {
          isDeleted: false,
          OR: [{ menteeId: userId }, { mentorId: userId }],
        },
        orderBy: { sessionDateTime: 'asc' },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_BOOKINGS.code,
        message: API_RESPONSE.SUCCESS.GET_BOOKINGS.message,
        data: bookings as unknown as BookingInterface[],
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_BOOKINGS.code,
        message: API_RESPONSE.ERROR.GET_BOOKINGS.message,
        data: null,
      };
    }
  }

  // ====================================================
  // UPDATE
  // ====================================================

  async update(
    id: string,
    dto: UpdateBookingDto,
    authenticatedUserId: string,
  ): Promise<ResponseDto<BookingInterface>> {
    try {
      const existing = await this.prisma.db.booking.findUnique({ where: { id } });

      if (!existing || existing.isDeleted) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.message,
          data: null,
        };
      }

      const isAdmin = await this.checkIsAdmin(authenticatedUserId);
      const isParticipant =
        existing.menteeId === authenticatedUserId ||
        existing.mentorId === authenticatedUserId;

      if (!isAdmin && !isParticipant) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.message,
          data: null,
        };
      }

      if (dto.sessionDateTime !== undefined) {
        const conflict = await this.checkBookingConflict(existing.mentorId, new Date(dto.sessionDateTime), id);
        if (conflict) return conflict as ResponseDto<BookingInterface>;
      }

      const updated = await this.prisma.db.booking.update({
        where: { id },
        data: {
          ...(dto.sessionDateTime !== undefined && {
            sessionDateTime: dto.sessionDateTime,
          }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.sessionLink !== undefined && { sessionLink: dto.sessionLink }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPDATE_BOOKING.code,
        message: API_RESPONSE.SUCCESS.UPDATE_BOOKING.message,
        data: updated as unknown as BookingInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.UPDATE_BOOKING.code,
        message: API_RESPONSE.ERROR.UPDATE_BOOKING.message,
        data: null,
      };
    }
  }

  // ====================================================
  // SOFT DELETE
  // ====================================================

  async softDelete(
    id: string,
    authenticatedUserId: string,
  ): Promise<ResponseDto<null>> {
    try {
      const existing = await this.prisma.db.booking.findUnique({ where: { id } });

      if (!existing || existing.isDeleted) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.message,
          data: null,
        };
      }

      const isAdmin = await this.checkIsAdmin(authenticatedUserId);

      if (!isAdmin && existing.menteeId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.message,
          data: null,
        };
      }

      await this.prisma.db.booking.update({
        where: { id },
        data: {
          isDeleted: true,
          status: BookingStatus.DELETED,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.DELETE_BOOKING.code,
        message: API_RESPONSE.SUCCESS.DELETE_BOOKING.message,
        data: null,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.DELETE_BOOKING.code,
        message: API_RESPONSE.ERROR.DELETE_BOOKING.message,
        data: null,
      };
    }
  }

  // ====================================================
  // GET MENTOR BOOKINGS
  // ====================================================

  async findMentorBookings(
    mentorId: string,
    authenticatedUserId: string,
    query: MentorBookingsQueryDto,
  ): Promise<ResponseDto<BookingInterface[]>> {
    try {
      const isAdmin = await this.checkIsAdmin(authenticatedUserId);

      if (!isAdmin && mentorId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.message,
          data: null,
        };
      }

      const bookings = await this.prisma.db.booking.findMany({
        where: {
          mentorId,
          isDeleted: false,
          ...(query.status !== undefined && { status: query.status }),
        },
        orderBy: { sessionDateTime: 'asc' },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_MENTOR_BOOKINGS.code,
        message: API_RESPONSE.SUCCESS.GET_MENTOR_BOOKINGS.message,
        data: bookings as unknown as BookingInterface[],
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_MENTOR_BOOKINGS.code,
        message: API_RESPONSE.ERROR.GET_MENTOR_BOOKINGS.message,
        data: null,
      };
    }
  }

  // ====================================================
  // APPROVE BOOKING
  // ====================================================

  async approveBooking(
    id: string,
    authenticatedUserId: string,
    dto: ApproveBookingDto,
  ): Promise<ResponseDto<BookingInterface>> {
    try {
      const existing = await this.prisma.db.booking.findUnique({ where: { id } });

      if (!existing || existing.isDeleted) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.message,
          data: null,
        };
      }

      if (existing.mentorId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.message,
          data: null,
        };
      }

      if (existing.status !== BookingStatus.PENDING) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_INVALID_TRANSITION.code,
          message: API_RESPONSE.ERROR.BOOKING_INVALID_TRANSITION.message,
          data: null,
        };
      }

      const updated = await this.prisma.db.booking.update({
        where: { id },
        data: { status: BookingStatus.APPROVED, sessionLink: dto.sessionLink },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      await this.createNotification(
        existing.menteeId,
        'Booking Approved',
        'Your booking request has been approved by the mentor.',
        NotificationType.BOOKING,
        id,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.APPROVE_BOOKING.code,
        message: API_RESPONSE.SUCCESS.APPROVE_BOOKING.message,
        data: updated as unknown as BookingInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.APPROVE_BOOKING.code,
        message: API_RESPONSE.ERROR.APPROVE_BOOKING.message,
        data: null,
      };
    }
  }

  // ====================================================
  // REJECT BOOKING
  // ====================================================

  async rejectBooking(
    id: string,
    authenticatedUserId: string,
  ): Promise<ResponseDto<BookingInterface>> {
    try {
      const existing = await this.prisma.db.booking.findUnique({ where: { id } });

      if (!existing || existing.isDeleted) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.message,
          data: null,
        };
      }

      if (existing.mentorId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.message,
          data: null,
        };
      }

      if (existing.status !== BookingStatus.PENDING) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_INVALID_TRANSITION.code,
          message: API_RESPONSE.ERROR.BOOKING_INVALID_TRANSITION.message,
          data: null,
        };
      }

      const updated = await this.prisma.db.booking.update({
        where: { id },
        data: { status: BookingStatus.REJECTED },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      await this.createNotification(
        existing.menteeId,
        'Booking Rejected',
        'Your booking request has been declined by the mentor.',
        NotificationType.BOOKING,
        id,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.REJECT_BOOKING.code,
        message: API_RESPONSE.SUCCESS.REJECT_BOOKING.message,
        data: updated as unknown as BookingInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.REJECT_BOOKING.code,
        message: API_RESPONSE.ERROR.REJECT_BOOKING.message,
        data: null,
      };
    }
  }

  // ====================================================
  // COMPLETE BOOKING
  // ====================================================

  async completeBooking(
    id: string,
    authenticatedUserId: string,
  ): Promise<ResponseDto<BookingInterface>> {
    try {
      const existing = await this.prisma.db.booking.findUnique({ where: { id } });

      if (!existing || existing.isDeleted) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.BOOKING_NOT_FOUND.message,
          data: null,
        };
      }

      if (existing.mentorId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.BOOKING_ACCESS_DENIED.message,
          data: null,
        };
      }

      if (existing.status !== BookingStatus.APPROVED) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_INVALID_TRANSITION.code,
          message: API_RESPONSE.ERROR.BOOKING_INVALID_TRANSITION.message,
          data: null,
        };
      }

      if (existing.sessionDateTime > new Date()) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_INVALID_TRANSITION.code,
          message: 'Session has not yet occurred',
          data: null,
        };
      }

      const updated = await this.prisma.db.booking.update({
        where: { id },
        data: { status: BookingStatus.COMPLETED },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
        },
      });

      await this.createNotification(
        existing.menteeId,
        'Session Completed',
        'Your mentoring session has been marked as completed.',
        NotificationType.SESSION,
        id,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.COMPLETE_BOOKING.code,
        message: API_RESPONSE.SUCCESS.COMPLETE_BOOKING.message,
        data: updated as unknown as BookingInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.COMPLETE_BOOKING.code,
        message: API_RESPONSE.ERROR.COMPLETE_BOOKING.message,
        data: null,
      };
    }
  }

  // ====================================================
  // PRIVATE HELPERS
  // ====================================================

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
      this.logger.warn(`Failed to create notification for userId=${userId}: ${error.message}`);
    }
  }

  /**
   * Finds all admin users and sends each an in-app notification.
   * Failures are swallowed so they never block the main flow.
   */
  private async notifyAllAdmins(
    title: string,
    message: string,
    type: NotificationType,
    referenceId?: string,
  ): Promise<void> {
    try {
      const admins = await this.prisma.db.user.findMany({
        where: { role: UserRole.Admin },
        select: { id: true },
      });
      await Promise.all(
        admins.map(admin =>
          this.createNotification(admin.id, title, message, type, referenceId),
        ),
      );
    } catch (error) {
      this.logger.warn(`Failed to notify admins: ${error.message}`);
    }
  }

  private async checkIsAdmin(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role === UserRole.Admin;
    } catch {
      return false;
    }
  }

  /**
   * Validates that the requested sessionDateTime:
   * 1. Falls on a day the mentor is available
   * 2. Fits within one of the mentor's time frames for that day
   * 3. Does not overlap an existing PENDING or APPROVED booking for the mentor
   *
   * Returns a ResponseDto error on conflict, or null if the slot is valid.
   */
  private async checkBookingConflict(
    mentorId: string,
    sessionDateTime: Date,
    excludeBookingId?: string,
  ): Promise<ResponseDto<null> | null> {
    const profile = await this.prisma.db.mentorProfile.findUnique({
      where: { userId: mentorId },
      select: { availability: true, sessionDurationMinutes: true },
    });

    if (!profile) return null; // no profile — let the DB FK handle it

    const duration = profile.sessionDurationMinutes ?? 60;
    const availability = (profile.availability as unknown as { day: string; timeFrames: { from: string; to: string }[] }[]) ?? [];

    const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = DAYS[sessionDateTime.getDay()];

    const daySlot = availability.find(s => s.day === dayName);
    if (!daySlot || daySlot.timeFrames.length === 0) {
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.BOOKING_MENTOR_NOT_AVAILABLE_DAY.code,
        message: `${API_RESPONSE.ERROR.BOOKING_MENTOR_NOT_AVAILABLE_DAY.message}: mentor is not available on ${dayName}`,
        data: null,
      };
    }

    // Convert session to minutes-since-midnight (UTC)
    const sessionStart = sessionDateTime.getUTCHours() * 60 + sessionDateTime.getUTCMinutes();
    const sessionEnd = sessionStart + duration;

    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const fitsInFrame = daySlot.timeFrames.some(f => {
      const fStart = timeToMinutes(f.from);
      const fEnd = timeToMinutes(f.to);
      return sessionStart >= fStart && sessionEnd <= fEnd;
    });

    if (!fitsInFrame) {
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.BOOKING_OUTSIDE_AVAILABILITY.code,
        message: `${API_RESPONSE.ERROR.BOOKING_OUTSIDE_AVAILABILITY.message}: the session does not fit in any available time frame for ${dayName}`,
        data: null,
      };
    }

    // Check for overlapping existing bookings
    const startOfDay = new Date(sessionDateTime);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDateTime);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingBookings = await this.prisma.db.booking.findMany({
      where: {
        mentorId,
        isDeleted: false,
        status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED] },
        sessionDateTime: { gte: startOfDay, lte: endOfDay },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { sessionDateTime: true },
    });

    for (const existing of existingBookings) {
      const existStart = existing.sessionDateTime.getUTCHours() * 60 + existing.sessionDateTime.getUTCMinutes();
      const existEnd = existStart + duration;
      // Overlap if: sessionStart < existEnd AND existStart < sessionEnd
      if (sessionStart < existEnd && existStart < sessionEnd) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_SCHEDULE_CONFLICT.code,
          message: `${API_RESPONSE.ERROR.BOOKING_SCHEDULE_CONFLICT.message}: mentor already has a booking at this time`,
          data: null,
        };
      }
    }

    return null;
  }
}
