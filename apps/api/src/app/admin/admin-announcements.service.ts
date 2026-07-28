import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  NotificationInterface,
  NotificationStatus,
  NotificationType,
  ResponseDto,
  ResponseStatus,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { BroadcastAnnouncementDto } from '@gurokonekt/models';
import {
  NOTIFICATION_EVENTS,
  NotificationGateway,
} from '../gateway/notification-gateway.gateway';

@Injectable()
export class AdminAnnouncementsService {
  private readonly logger = new Logger(AdminAnnouncementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async broadcastAnnouncement(
    dto: BroadcastAnnouncementDto,
  ): Promise<ResponseDto> {
    try {
      const roleFilter =
        dto.targetRole === 'mentor'
          ? [UserRole.Mentor]
          : dto.targetRole === 'mentee'
            ? [UserRole.Mentee]
            : [UserRole.Mentor, UserRole.Mentee];

      const users = await this.prisma.db.user.findMany({
        where: {
          role: { in: roleFilter },
          status: {
            notIn: [
              UserStatus.Deleted,
              UserStatus.Banned,
              UserStatus.Suspended,
            ],
          },
        },
        select: { id: true },
      });

      if (users.length === 0) {
        return {
          status: ResponseStatus.Success,
          statusCode: API_RESPONSE.SUCCESS.ADMIN_BROADCAST_ANNOUNCEMENT.code,
          message: API_RESPONSE.SUCCESS.ADMIN_BROADCAST_ANNOUNCEMENT.message,
          data: { sent: 0 },
        };
      }

      const notifications = await this.prisma.db.$transaction(
        users.map((user) =>
          this.prisma.db.notification.create({
            data: {
              userId: user.id,
              title: dto.title,
              message: dto.message,
              type: NotificationType.ANNOUNCEMENT,
              status: NotificationStatus.UNREAD,
            },
          }),
        ),
      );

      for (const notification of notifications) {
        this.notificationGateway.sendNotificationToUser(
          notification.userId,
          notification as unknown as NotificationInterface,
          NOTIFICATION_EVENTS.CREATED,
        );
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_BROADCAST_ANNOUNCEMENT.code,
        message: API_RESPONSE.SUCCESS.ADMIN_BROADCAST_ANNOUNCEMENT.message,
        data: { sent: users.length },
      };
    } catch (error: unknown) {
      const caughtError =
        error instanceof Error ? error : new Error(String(error));
      this.logger.error(caughtError.message, caughtError.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_BROADCAST_ANNOUNCEMENT.code,
        message: API_RESPONSE.ERROR.ADMIN_BROADCAST_ANNOUNCEMENT.message,
        data: caughtError,
      };
    }
  }
}
