import { Injectable, Logger } from '@nestjs/common';
import {
  AddNotificationRecipientDto,
  API_RESPONSE,
  LogsActionType,
  ResponseDto,
  ResponseStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminNotificationRecipientsService {
  private readonly logger = new Logger(AdminNotificationRecipientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRecipients(): Promise<ResponseDto> {
    try {
      const recipients = await this.prisma.db.adminNotificationRecipient.findMany({
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_NOTIFICATION_RECIPIENTS.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_NOTIFICATION_RECIPIENTS.message,
        data: recipients.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_NOTIFICATION_RECIPIENTS.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_NOTIFICATION_RECIPIENTS.message,
        data: error,
      };
    }
  }

  async addRecipient(
    dto: AddNotificationRecipientDto,
    adminId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ResponseDto> {
    const email = dto.email.trim().toLowerCase();

    try {
      const recipient = await this.prisma.db.$transaction(async (tx) => {
        const created = await tx.adminNotificationRecipient.create({
          data: { email, createdById: adminId },
          select: { id: true, email: true, createdAt: true },
        });

        await tx.logs.create({
          data: {
            actionType: LogsActionType.AdminAddNotificationRecipient,
            targetId: created.id,
            details: API_RESPONSE.SUCCESS.ADMIN_ADD_NOTIFICATION_RECIPIENT.message,
            metadata: { email },
            ipAddress: ipAddress ?? '',
            userAgent: userAgent ?? '',
            createdById: adminId,
          },
        });

        return created;
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_ADD_NOTIFICATION_RECIPIENT.code,
        message: API_RESPONSE.SUCCESS.ADMIN_ADD_NOTIFICATION_RECIPIENT.message,
        data: { ...recipient, createdAt: recipient.createdAt.toISOString() },
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_RECIPIENT_ALREADY_EXISTS.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_RECIPIENT_ALREADY_EXISTS.message,
          data: null,
        };
      }
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_ADD_NOTIFICATION_RECIPIENT.code,
        message: API_RESPONSE.ERROR.ADMIN_ADD_NOTIFICATION_RECIPIENT.message,
        data: error,
      };
    }
  }

  async removeRecipient(
    recipientId: string,
    adminId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ResponseDto> {
    try {
      const existing = await this.prisma.db.adminNotificationRecipient.findUnique({
        where: { id: recipientId },
        select: { id: true, email: true },
      });

      if (!existing) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_RECIPIENT_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_RECIPIENT_NOT_FOUND.message,
          data: null,
        };
      }

      await this.prisma.db.$transaction(async (tx) => {
        await tx.adminNotificationRecipient.delete({ where: { id: recipientId } });
        await tx.logs.create({
          data: {
            actionType: LogsActionType.AdminRemoveNotificationRecipient,
            targetId: recipientId,
            details: API_RESPONSE.SUCCESS.ADMIN_REMOVE_NOTIFICATION_RECIPIENT.message,
            metadata: { email: existing.email },
            ipAddress: ipAddress ?? '',
            userAgent: userAgent ?? '',
            createdById: adminId,
          },
        });
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_REMOVE_NOTIFICATION_RECIPIENT.code,
        message: API_RESPONSE.SUCCESS.ADMIN_REMOVE_NOTIFICATION_RECIPIENT.message,
        data: null,
      };
    } catch (error: any) {
      // Removed by another admin between the lookup and the delete.
      if (error?.code === 'P2025') {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.NOTIFICATION_RECIPIENT_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.NOTIFICATION_RECIPIENT_NOT_FOUND.message,
          data: null,
        };
      }
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_REMOVE_NOTIFICATION_RECIPIENT.code,
        message: API_RESPONSE.ERROR.ADMIN_REMOVE_NOTIFICATION_RECIPIENT.message,
        data: error,
      };
    }
  }
}
