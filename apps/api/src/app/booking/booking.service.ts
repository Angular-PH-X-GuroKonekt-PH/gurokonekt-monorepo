import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  API_RESPONSE,
  BookingInterface,
  BookingStatus,
  CreateBookingDto,
  ResponseDto,
  ResponseStatus,
  UpdateBookingDto,
  UserRole,
} from '@gurokonekt/models';

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

  constructor(private readonly prisma: PrismaService) {}

  // ====================================================
  // CREATE
  // ====================================================

  async create(
    dto: CreateBookingDto,
    menteeId: string,
  ): Promise<ResponseDto<BookingInterface>> {
    try {
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
  // PRIVATE HELPERS
  // ====================================================

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
}
