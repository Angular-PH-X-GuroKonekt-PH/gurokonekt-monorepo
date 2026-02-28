import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  API_RESPONSE,
  CreateNotificationDto,
  NotificationInterface,
  NotificationStatus,
  ResponseDto,
  ResponseStatus,
  UpdateNotificationDto,
  UserRole,
} from '@gurokonekt/models';
import {
  NOTIFICATION_EVENTS,
  NotificationGateway,
} from '../gateway/notification-gateway.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // ====================================================
  // CREATE
  // ====================================================

  async create(dto: CreateNotificationDto): Promise<ResponseDto<NotificationInterface>> {
    try {
      const notification = await this.prisma.db.notification.create({
        data: {
          userId: dto.userId,
          title: dto.title,
          message: dto.message,
          type: dto.type,
          status: NotificationStatus.UNREAD,
          referenceId: dto.referenceId ?? null,
        },
      });

      this.notificationGateway.sendNotificationToUser(
        notification.userId,
        notification as unknown as NotificationInterface,
        NOTIFICATION_EVENTS.CREATED,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.CREATE_NOTIFICATION.code,
        message: API_RESPONSE.SUCCESS.CREATE_NOTIFICATION.message,
        data: notification as unknown as NotificationInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.CREATE_NOTIFICATION.code,
        message: API_RESPONSE.ERROR.CREATE_NOTIFICATION.message,
        data: null,
      };
    }
  }

  // ====================================================
  // GET ALL (admin)
  // ====================================================

  async findAll(): Promise<ResponseDto<NotificationInterface[]>> {
    try {
      const notifications = await this.prisma.db.notification.findMany({
        where: {
          status: { not: NotificationStatus.DELETED },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_NOTIFICATIONS.code,
        message: API_RESPONSE.SUCCESS.GET_NOTIFICATIONS.message,
        data: notifications as unknown as NotificationInterface[],
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_NOTIFICATIONS.code,
        message: API_RESPONSE.ERROR.GET_NOTIFICATIONS.message,
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
  ): Promise<ResponseDto<NotificationInterface>> {
    try {
      const notification = await this.prisma.db.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.status === NotificationStatus.DELETED) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_NOT_FOUND.message,
          data: null,
        };
      }

      const isAdmin = await this.checkIsAdmin(authenticatedUserId);

      if (!isAdmin && notification.userId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_ACCESS_DENIED.message,
          data: null,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_NOTIFICATION.code,
        message: API_RESPONSE.SUCCESS.GET_NOTIFICATION.message,
        data: notification as unknown as NotificationInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_NOTIFICATION.code,
        message: API_RESPONSE.ERROR.GET_NOTIFICATION.message,
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
  ): Promise<ResponseDto<NotificationInterface[]>> {
    try {
      const isAdmin = await this.checkIsAdmin(authenticatedUserId);

      if (!isAdmin && userId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_ACCESS_DENIED.message,
          data: null,
        };
      }

      const notifications = await this.prisma.db.notification.findMany({
        where: {
          userId,
          status: { not: NotificationStatus.DELETED },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_NOTIFICATIONS.code,
        message: API_RESPONSE.SUCCESS.GET_NOTIFICATIONS.message,
        data: notifications as unknown as NotificationInterface[],
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_NOTIFICATIONS.code,
        message: API_RESPONSE.ERROR.GET_NOTIFICATIONS.message,
        data: null,
      };
    }
  }

  // ====================================================
  // UPDATE
  // ====================================================

  async update(
    id: string,
    dto: UpdateNotificationDto,
    authenticatedUserId: string,
  ): Promise<ResponseDto<NotificationInterface>> {
    try {
      const existing = await this.prisma.db.notification.findUnique({ where: { id } });

      if (!existing || existing.status === NotificationStatus.DELETED) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_NOT_FOUND.message,
          data: null,
        };
      }

      const isAdmin = await this.checkIsAdmin(authenticatedUserId);

      if (!isAdmin && existing.userId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_ACCESS_DENIED.message,
          data: null,
        };
      }

      const updateData: {
        status?: NotificationStatus;
        message?: string;
        readAt?: Date;
      } = {};

      if (dto.status !== undefined) {
        updateData.status = dto.status;
        if (dto.status === NotificationStatus.READ) {
          updateData.readAt = new Date();
        }
      }

      if (dto.message !== undefined) {
        updateData.message = dto.message;
      }

      const updated = await this.prisma.db.notification.update({
        where: { id },
        data: updateData,
      });

      this.notificationGateway.sendNotificationToUser(
        updated.userId,
        updated as unknown as NotificationInterface,
        NOTIFICATION_EVENTS.UPDATED,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPDATE_NOTIFICATION.code,
        message: API_RESPONSE.SUCCESS.UPDATE_NOTIFICATION.message,
        data: updated as unknown as NotificationInterface,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.UPDATE_NOTIFICATION.code,
        message: API_RESPONSE.ERROR.UPDATE_NOTIFICATION.message,
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
      const existing = await this.prisma.db.notification.findUnique({ where: { id } });

      if (!existing || existing.status === NotificationStatus.DELETED) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_NOT_FOUND.message,
          data: null,
        };
      }

      const isAdmin = await this.checkIsAdmin(authenticatedUserId);

      if (!isAdmin && existing.userId !== authenticatedUserId) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_ACCESS_DENIED.message,
          data: null,
        };
      }

      await this.prisma.db.notification.update({
        where: { id },
        data: { status: NotificationStatus.DELETED },
      });

      this.notificationGateway.sendNotificationToUser(
        existing.userId,
        { id },
        NOTIFICATION_EVENTS.DELETED,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.DELETE_NOTIFICATION.code,
        message: API_RESPONSE.SUCCESS.DELETE_NOTIFICATION.message,
        data: null,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.DELETE_NOTIFICATION.code,
        message: API_RESPONSE.ERROR.DELETE_NOTIFICATION.message,
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
