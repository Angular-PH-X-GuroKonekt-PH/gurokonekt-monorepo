import { Injectable, Logger } from '@nestjs/common';
import {
  AdminAnnouncementListResponseInterface,
  AdminAnnouncementSummaryInterface,
  API_RESPONSE,
  BroadcastAnnouncementDto,
  ListAnnouncementsQueryDto,
  NotificationInterface,
  NotificationStatus,
  NotificationType,
  ResponseDto,
  ResponseStatus,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import {
  NOTIFICATION_EVENTS,
  NotificationGateway,
} from '../gateway/notification-gateway.gateway';
import { randomUUID } from 'crypto';

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

      const announcementId = randomUUID();
      const notifications = await this.prisma.db.$transaction(
        users.map((user) =>
          this.prisma.db.notification.create({
            data: {
              userId: user.id,
              title: dto.title,
              message: dto.message,
              type: NotificationType.ANNOUNCEMENT,
              status: NotificationStatus.UNREAD,
              referenceId: announcementId,
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

  async findAllAnnouncements(
    query: ListAnnouncementsQueryDto = {},
  ): Promise<ResponseDto<AdminAnnouncementListResponseInterface>> {
    try {
      const {
        search,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = query;
      const notifications = await this.prisma.db.notification.findMany({
        where: {
          type: NotificationType.ANNOUNCEMENT,
          status: { not: NotificationStatus.DELETED },
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                  ...(dateTo
                    ? { lte: new Date(`${dateTo}T23:59:59.999Z`) }
                    : {}),
                },
              }
            : {}),
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { message: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: {
          referenceId: true,
          title: true,
          message: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const announcements = new Map<
        string,
        AdminAnnouncementSummaryInterface
      >();

      for (const notification of notifications) {
        // Broadcasts created before announcement IDs were introduced have no
        // reference ID. They were inserted in one transaction, so their
        // timestamp, title, and message form a stable legacy grouping key.
        const key =
          notification.referenceId ??
          [
            'legacy',
            notification.createdAt.toISOString(),
            notification.title,
            notification.message,
          ].join(':');
        const existing = announcements.get(key);

        if (existing) {
          existing.recipientCount += 1;
          continue;
        }

        announcements.set(key, {
          id: notification.referenceId ?? key,
          title: notification.title,
          message: notification.message,
          recipientCount: 1,
          createdAt: notification.createdAt.toISOString(),
        });
      }

      const summaries = [...announcements.values()].sort((first, second) => {
        const comparison =
          sortBy === 'title'
            ? first.title.localeCompare(second.title)
            : sortBy === 'recipientCount'
              ? first.recipientCount - second.recipientCount
              : new Date(first.createdAt).getTime() -
                new Date(second.createdAt).getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      const total = summaries.length;
      const paginatedAnnouncements = summaries.slice(
        (page - 1) * limit,
        page * limit,
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_ANNOUNCEMENTS.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_ANNOUNCEMENTS.message,
        data: {
          data: paginatedAnnouncements,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      const caughtError =
        error instanceof Error ? error : new Error(String(error));
      this.logger.error(caughtError.message, caughtError.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_ANNOUNCEMENTS.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_ANNOUNCEMENTS.message,
        data: null,
      };
    }
  }
}
