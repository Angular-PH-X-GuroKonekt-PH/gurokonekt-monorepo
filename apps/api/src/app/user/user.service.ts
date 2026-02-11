import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { API_RESPONSE, ResponseDto, ResponseStatus, SelectFields, UpdateUserRoleDto, UpdateUserStatusDto } from '@gurokonekt/models';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly prisma: PrismaService) {}

  // ====================================================
  // GET
  // ====================================================

  // ====================================================
  // POST
  // ====================================================

  // ====================================================
  // PATCH
  // ====================================================

  async updateUserStatus(dto: UpdateUserStatusDto, userId: string): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.update({
        where: { id: userId },
        data: {
          status: dto.status,
          updatedBy: {
            connect: { id: dto.updatedById },
          },
        },
        select: SelectFields.getUserCredentialsSelect(),
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPDATE_USER_STATUS.code,
        message: API_RESPONSE.SUCCESS.UPDATE_USER_STATUS.message,
        data: user,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.UPDATE_USER_STATUS.code,
        message: API_RESPONSE.ERROR.UPDATE_USER_STATUS.message,
        data: null,
      };
    }
  }

  async updateUserRole(dto: UpdateUserRoleDto, userId: string): Promise<ResponseDto> {
      try {
        const user = await this.prisma.db.user.update({
          where: { id: userId },
          data: {
            role: dto.role,
            updatedBy: {
              connect: { id: dto.updatedById },
            },
          },
          select: SelectFields.getUserCredentialsSelect(),
        });
  
        return {
          status: ResponseStatus.Success,
          statusCode: API_RESPONSE.SUCCESS.UPDATE_USER_ROLE.code,
          message: API_RESPONSE.SUCCESS.UPDATE_USER_ROLE.message,
          data: user,
        };
      } catch (error) {
        this.logger.error(error.message, error.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.UPDATE_USER_ROLE.code,
          message: API_RESPONSE.ERROR.UPDATE_USER_ROLE.message,
          data: null,
        };
      }
    }
}
