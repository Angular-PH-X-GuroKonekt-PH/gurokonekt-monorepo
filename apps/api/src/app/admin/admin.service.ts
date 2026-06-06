import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  ListMenteesQueryDto,
  ResponseDto,
  ResponseStatus,
  UserRole,
  UserStatus,
  LogsActionType,
  SelectFields,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  async getMentees(query: ListMenteesQueryDto): Promise<ResponseDto> {
    try {
      const {
        status = 'all',
        dateFrom,
        dateTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = query;

      const where: Record<string, unknown> = { role: UserRole.Mentee };

      if (status !== 'all') {
        where['status'] = status === 'active' ? UserStatus.Active : UserStatus.Inactive;
      }

      if (dateFrom || dateTo) {
        where['createdAt'] = {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        };
      }

      if (search?.trim()) {
        const term = search.trim();
        where['OR'] = [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [mentees, total] = await Promise.all([
        this.prisma.db.user.findMany({
          where,
          select: SelectFields.getUserCredentialsSelect(),
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.db.user.count({ where }),
      ]);

      const enriched = await Promise.all(
        mentees.map(async (mentee) => {
          const isEmailVerified = await this.getIsEmailVerified(mentee.id);
          return {
            id: mentee.id,
            firstName: mentee.firstName,
            middleName: mentee.middleName,
            lastName: mentee.lastName,
            email: mentee.email,
            phoneNumber: mentee.phoneNumber,
            country: mentee.country,
            status: mentee.status,
            isEmailVerified,
            isProfileComplete: mentee.isProfileComplete,
            createdAt: mentee.createdAt.toISOString(),
            avatarUrl: mentee.avatarAttachments[0]?.publicUrl ?? null,
          };
        }),
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_MENTEES.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_MENTEES.message,
        data: {
          data: enriched,
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
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_MENTEES.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_MENTEES.message,
        data: error,
      };
    }
  }

  async getMenteeById(menteeId: string): Promise<ResponseDto> {
    try {
      const mentee = await this.prisma.db.user.findFirst({
        where: { id: menteeId, role: UserRole.Mentee },
        select: {
          ...SelectFields.getUserCredentialsSelect(),
          menteeProfiles: {
            select: SelectFields.getMenteeProfileOnlySelect(),
            take: 1,
          },
        },
      });

      if (!mentee) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      const isEmailVerified = await this.getIsEmailVerified(mentee.id);

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_MENTEE.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_MENTEE.message,
        data: {
          id: mentee.id,
          firstName: mentee.firstName,
          middleName: mentee.middleName,
          lastName: mentee.lastName,
          email: mentee.email,
          phoneNumber: mentee.phoneNumber,
          country: mentee.country,
          language: mentee.language,
          timezone: mentee.timezone,
          status: mentee.status,
          isEmailVerified,
          isProfileComplete: mentee.isProfileComplete,
          createdAt: mentee.createdAt.toISOString(),
          avatarUrl: mentee.avatarAttachments[0]?.publicUrl ?? null,
          menteeProfile: mentee.menteeProfiles[0] ?? null,
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_MENTEE.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_MENTEE.message,
        data: error,
      };
    }
  }

  async activateMentee(menteeId: string, adminId: string, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const mentee = await this.prisma.db.user.findFirst({
        where: { id: menteeId, role: UserRole.Mentee },
        select: { id: true },
      });

      if (!mentee) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      await this.prisma.db.user.update({
        where: { id: menteeId },
        data: { status: UserStatus.Active, updatedById: adminId },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.AdminActivateMentee,
          targetId: menteeId,
          details: API_RESPONSE.SUCCESS.ADMIN_ACTIVATE_MENTEE.message,
          metadata: { menteeId },
          ipAddress,
          userAgent,
          createdById: adminId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_ACTIVATE_MENTEE.code,
        message: API_RESPONSE.SUCCESS.ADMIN_ACTIVATE_MENTEE.message,
        data: null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_ACTIVATE_MENTEE.code,
        message: API_RESPONSE.ERROR.ADMIN_ACTIVATE_MENTEE.message,
        data: error,
      };
    }
  }

  async deactivateMentee(menteeId: string, adminId: string, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const mentee = await this.prisma.db.user.findFirst({
        where: { id: menteeId, role: UserRole.Mentee },
        select: { id: true },
      });

      if (!mentee) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      await this.prisma.db.user.update({
        where: { id: menteeId },
        data: { status: UserStatus.Inactive, updatedById: adminId },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.AdminDeactivateMentee,
          targetId: menteeId,
          details: API_RESPONSE.SUCCESS.ADMIN_DEACTIVATE_MENTEE.message,
          metadata: { menteeId },
          ipAddress,
          userAgent,
          createdById: adminId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_DEACTIVATE_MENTEE.code,
        message: API_RESPONSE.SUCCESS.ADMIN_DEACTIVATE_MENTEE.message,
        data: null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_DEACTIVATE_MENTEE.code,
        message: API_RESPONSE.ERROR.ADMIN_DEACTIVATE_MENTEE.message,
        data: error,
      };
    }
  }

  async rejectMentee(menteeId: string, reason: string, adminId: string, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const mentee = await this.prisma.db.user.findFirst({
        where: { id: menteeId, role: UserRole.Mentee },
        select: { id: true },
      });

      if (!mentee) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      await this.prisma.db.user.update({
        where: { id: menteeId },
        data: { status: UserStatus.Rejected, updatedById: adminId },
      });

      await this.prisma.db.adminRejectionLog.create({
        data: {
          menteeId,
          adminId,
          reason,
        },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.AdminRejectMentee,
          targetId: menteeId,
          details: API_RESPONSE.SUCCESS.ADMIN_REJECT_MENTEE.message,
          metadata: { menteeId, reason },
          ipAddress,
          userAgent,
          createdById: adminId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_REJECT_MENTEE.code,
        message: API_RESPONSE.SUCCESS.ADMIN_REJECT_MENTEE.message,
        data: null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_REJECT_MENTEE.code,
        message: API_RESPONSE.ERROR.ADMIN_REJECT_MENTEE.message,
        data: error,
      };
    }
  }

  async resendVerification(menteeId: string, adminId: string, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    return this.authService.adminResendEmailConfirmation(menteeId, adminId, ipAddress, userAgent);
  }

  async getRejectionLog(menteeId: string): Promise<ResponseDto> {
    try {
      const log = await this.prisma.db.adminRejectionLog.findFirst({
        where: { menteeId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          menteeId: true,
          adminId: true,
          reason: true,
          createdAt: true,
        },
      });

      if (!log) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.REJECTION_LOG_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.REJECTION_LOG_NOT_FOUND.message,
          data: null,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_REJECTION_LOG.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_REJECTION_LOG.message,
        data: { ...log, createdAt: log.createdAt.toISOString() },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_REJECTION_LOG.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_REJECTION_LOG.message,
        data: error,
      };
    }
  }

  private async getIsEmailVerified(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.clientAdmin.auth.admin.getUserById(userId);
      if (error || !data?.user) return false;
      return !!data.user.email_confirmed_at;
    } catch {
      return false;
    }
  }
}
