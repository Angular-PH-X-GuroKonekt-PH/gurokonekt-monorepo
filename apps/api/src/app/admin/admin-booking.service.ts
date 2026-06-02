import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  AdminListBookingsQueryDto,
  BookingStatus,
  LogsActionType,
  ResponseDto,
  ResponseStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';

const BOOKING_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarAttachments: { select: { publicUrl: true } },
} as const;

@Injectable()
export class AdminBookingService {
  private readonly logger = new Logger(AdminBookingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listBookings(query: AdminListBookingsQueryDto): Promise<ResponseDto> {
    try {
      const {
        status,
        dateFrom,
        dateTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = query;

      const where: Record<string, unknown> = { isDeleted: false };

      if (status) where['status'] = status;

      if (dateFrom || dateTo) {
        where['sessionDateTime'] = {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        };
      }

      if (search) {
        where['OR'] = [
          { mentor: { firstName: { contains: search, mode: 'insensitive' } } },
          { mentor: { lastName: { contains: search, mode: 'insensitive' } } },
          { mentee: { firstName: { contains: search, mode: 'insensitive' } } },
          { mentee: { lastName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const skip = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        this.prisma.db.booking.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
          include: {
            mentor: { select: BOOKING_USER_SELECT },
            mentee: { select: BOOKING_USER_SELECT },
          },
        }),
        this.prisma.db.booking.count({ where }),
      ]);

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_BOOKINGS.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_BOOKINGS.message,
        data: {
          data: bookings,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_BOOKINGS.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_BOOKINGS.message,
        data: error,
      };
    }
  }

  async getBookingById(bookingId: string): Promise<ResponseDto> {
    try {
      const booking = await this.prisma.db.booking.findUnique({
        where: { id: bookingId },
        include: {
          mentor: { select: BOOKING_USER_SELECT },
          mentee: { select: BOOKING_USER_SELECT },
          feedback: {
            select: {
              id: true,
              userId: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: { select: { firstName: true, lastName: true, role: true } },
            },
          },
        },
      });

      if (!booking) {
        return {
          status: ResponseStatus.Error,
          statusCode: 404,
          message: 'Booking not found',
          data: null,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_BOOKING.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_BOOKING.message,
        data: booking,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_BOOKING.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_BOOKING.message,
        data: error,
      };
    }
  }

  async forceCancelBooking(
    bookingId: string,
    reason: string,
    adminId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ResponseDto> {
    try {
      const booking = await this.prisma.db.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, status: true, isDeleted: true },
      });

      if (!booking || booking.isDeleted) {
        return {
          status: ResponseStatus.Error,
          statusCode: 404,
          message: 'Booking not found',
          data: null,
        };
      }

      const nonCancellableStatuses = [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
        BookingStatus.DELETED,
      ];

      if (nonCancellableStatuses.includes(booking.status as BookingStatus)) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.BOOKING_CANNOT_BE_CANCELLED.code,
          message: API_RESPONSE.ERROR.BOOKING_CANNOT_BE_CANCELLED.message,
          data: null,
        };
      }

      await this.prisma.db.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelReason: reason,
        },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.AdminForceCancelBooking,
          targetId: bookingId,
          details: API_RESPONSE.SUCCESS.ADMIN_FORCE_CANCEL_BOOKING.message,
          metadata: { bookingId, reason },
          ipAddress,
          userAgent,
          createdById: adminId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_FORCE_CANCEL_BOOKING.code,
        message: API_RESPONSE.SUCCESS.ADMIN_FORCE_CANCEL_BOOKING.message,
        data: null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_FORCE_CANCEL_BOOKING.code,
        message: API_RESPONSE.ERROR.ADMIN_FORCE_CANCEL_BOOKING.message,
        data: error,
      };
    }
  }
}
