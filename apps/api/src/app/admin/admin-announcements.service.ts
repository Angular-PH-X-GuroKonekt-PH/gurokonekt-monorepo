import { Injectable, Logger } from '@nestjs/common';
import { API_RESPONSE, ResponseDto, ResponseStatus, UserRole, UserStatus } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { BroadcastAnnouncementDto } from '@gurokonekt/models';

@Injectable()
export class AdminAnnouncementsService {
  private readonly logger = new Logger(AdminAnnouncementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async broadcastAnnouncement(dto: BroadcastAnnouncementDto): Promise<ResponseDto> {
    try {
      const roleFilter = dto.targetRole === 'mentor'
        ? [UserRole.Mentor]
        : dto.targetRole === 'mentee'
          ? [UserRole.Mentee]
          : [UserRole.Mentor, UserRole.Mentee];

      const users = await this.prisma.db.user.findMany({
        where: {
          role: { in: roleFilter },
          status: UserStatus.Active,
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

      await this.prisma.db.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title: dto.title,
          message: dto.message,
          type: 'ANNOUNCEMENT',
        })),
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_BROADCAST_ANNOUNCEMENT.code,
        message: API_RESPONSE.SUCCESS.ADMIN_BROADCAST_ANNOUNCEMENT.message,
        data: { sent: users.length },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_BROADCAST_ANNOUNCEMENT.code,
        message: API_RESPONSE.ERROR.ADMIN_BROADCAST_ANNOUNCEMENT.message,
        data: error,
      };
    }
  }
}
