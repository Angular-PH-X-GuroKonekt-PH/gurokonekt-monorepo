import { Injectable, Logger } from '@nestjs/common';
import { API_RESPONSE, ResponseDto, ResponseStatus, UserRole } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRolesService {
  private readonly logger = new Logger(AdminRolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAdmins(): Promise<ResponseDto> {
    try {
      const admins = await this.prisma.db.user.findMany({
        where: { role: UserRole.Admin },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_ROLES.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_ROLES.message,
        data: {
          total: admins.length,
          admins: admins.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
          })),
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_ROLES.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_ROLES.message,
        data: error,
      };
    }
  }
}
