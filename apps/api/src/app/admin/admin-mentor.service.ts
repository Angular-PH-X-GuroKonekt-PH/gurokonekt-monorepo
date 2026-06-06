import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  AdminRejectMentorDto,
  ListMentorsQueryDto,
  LogsActionType,
  ResponseDto,
  ResponseStatus,
  SelectFields,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AdminMentorService {
  private readonly logger = new Logger(AdminMentorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getMentors(query: ListMentorsQueryDto): Promise<ResponseDto> {
    try {
      const {
        status = 'all',
        search,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = query;

      const where: Record<string, unknown> = { role: UserRole.Mentor };

      if (status !== 'all') {
        if (status === 'pending') {
          where['status'] = { in: [UserStatus.PendingApproval, UserStatus.PendingReview] };
        } else if (status === 'approved') {
          where['status'] = UserStatus.Approved;
        } else if (status === 'rejected') {
          where['status'] = UserStatus.Rejected;
        } else if (status === 'inactive') {
          where['status'] = UserStatus.Inactive;
        }
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

      const [mentors, total] = await Promise.all([
        this.prisma.db.user.findMany({
          where,
          select: SelectFields.getUserCredentialsSelect(),
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.db.user.count({ where }),
      ]);

      const data = mentors.map((mentor) => ({
        id: mentor.id,
        firstName: mentor.firstName,
        middleName: mentor.middleName,
        lastName: mentor.lastName,
        email: mentor.email,
        status: mentor.status,
        isMentorApproved: mentor.isMentorApproved,
        isMentorProfileComplete: mentor.isMentorProfileComplete,
        isProfileComplete: mentor.isProfileComplete,
        createdAt: mentor.createdAt.toISOString(),
        avatarUrl: mentor.avatarAttachments[0]?.publicUrl ?? null,
      }));

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_MENTORS.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_MENTORS.message,
        data: {
          data,
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
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_MENTORS.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_MENTORS.message,
        data: error,
      };
    }
  }

  async getMentorById(mentorId: string): Promise<ResponseDto> {
    try {
      const mentor = await this.prisma.db.user.findFirst({
        where: { id: mentorId, role: UserRole.Mentor },
        select: {
          ...SelectFields.getUserCredentialsSelect(),
          mentorProfiles: {
            select: SelectFields.getMentorProfileOnlySelect(),
            take: 1,
          },
          documentAttachments: {
            select: SelectFields.getDocumentAttachmentSelect(),
          },
        },
      });

      if (!mentor) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_MENTOR.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_MENTOR.message,
        data: {
          id: mentor.id,
          firstName: mentor.firstName,
          middleName: mentor.middleName,
          lastName: mentor.lastName,
          email: mentor.email,
          phoneNumber: mentor.phoneNumber,
          country: mentor.country,
          language: mentor.language,
          timezone: mentor.timezone,
          status: mentor.status,
          isMentorApproved: mentor.isMentorApproved,
          isMentorProfileComplete: mentor.isMentorProfileComplete,
          isProfileComplete: mentor.isProfileComplete,
          createdAt: mentor.createdAt.toISOString(),
          avatarUrl: mentor.avatarAttachments[0]?.publicUrl ?? null,
          mentorProfile: mentor.mentorProfiles[0] ?? null,
          documentAttachments: mentor.documentAttachments,
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_MENTOR.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_MENTOR.message,
        data: error,
      };
    }
  }

  async getMentorRejectionLog(mentorId: string): Promise<ResponseDto> {
    try {
      const log = await this.prisma.db.adminRejectionLog.findFirst({
        where: { mentorId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          mentorId: true,
          adminId: true,
          reason: true,
          createdAt: true,
        },
      });

      if (!log) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTOR_REJECTION_LOG_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.MENTOR_REJECTION_LOG_NOT_FOUND.message,
          data: null,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_MENTOR_REJECTION_LOG.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_MENTOR_REJECTION_LOG.message,
        data: { ...log, createdAt: log.createdAt.toISOString() },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_MENTOR_REJECTION_LOG.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_MENTOR_REJECTION_LOG.message,
        data: error,
      };
    }
  }

  async getMentorDeactivationFeedback(mentorId: string): Promise<ResponseDto> {
    try {
      const feedback = await this.prisma.db.deactivationFeedback.findUnique({
        where: { userId: mentorId },
        select: { id: true, userId: true, reason: true, createdAt: true },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_MENTOR_DEACTIVATION_FEEDBACK.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_MENTOR_DEACTIVATION_FEEDBACK.message,
        data: feedback
          ? { ...feedback, createdAt: feedback.createdAt.toISOString() }
          : null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_MENTOR_DEACTIVATION_FEEDBACK.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_MENTOR_DEACTIVATION_FEEDBACK.message,
        data: error,
      };
    }
  }

  async approveMentor(mentorId: string, adminId: string, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const mentor = await this.prisma.db.user.findFirst({
        where: { id: mentorId, role: UserRole.Mentor },
        select: { id: true, firstName: true, email: true, status: true },
      });

      if (!mentor) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      const pendingStatuses: UserStatus[] = [UserStatus.PendingApproval, UserStatus.PendingReview];
      if (!pendingStatuses.includes(mentor.status as UserStatus)) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_APPROVE.code,
          message: API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_APPROVE.message,
          data: null,
        };
      }

      await this.prisma.db.user.update({
        where: { id: mentorId },
        data: { status: UserStatus.Approved, isMentorApproved: true, updatedById: adminId },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.AdminApproveMentor,
          targetId: mentorId,
          details: API_RESPONSE.SUCCESS.ADMIN_APPROVE_MENTOR.message,
          metadata: { mentorId },
          ipAddress,
          userAgent,
          createdById: adminId,
        },
      });

      this.mailService.sendMentorApprovalEmail(mentor.email, mentor.firstName);

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_APPROVE_MENTOR.code,
        message: API_RESPONSE.SUCCESS.ADMIN_APPROVE_MENTOR.message,
        data: null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_APPROVE_MENTOR.code,
        message: API_RESPONSE.ERROR.ADMIN_APPROVE_MENTOR.message,
        data: error,
      };
    }
  }

  async rejectMentor(mentorId: string, dto: AdminRejectMentorDto, adminId: string, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const mentor = await this.prisma.db.user.findFirst({
        where: { id: mentorId, role: UserRole.Mentor },
        select: { id: true, firstName: true, email: true, status: true },
      });

      if (!mentor) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      const pendingStatuses: UserStatus[] = [UserStatus.PendingApproval, UserStatus.PendingReview];
      if (!pendingStatuses.includes(mentor.status as UserStatus)) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_REJECT.code,
          message: API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_REJECT.message,
          data: null,
        };
      }

      await this.prisma.db.user.update({
        where: { id: mentorId },
        data: { status: UserStatus.Rejected, isMentorApproved: false, updatedById: adminId },
      });

      await this.prisma.db.adminRejectionLog.create({
        data: { mentorId, adminId, reason: dto.reason },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.AdminRejectMentor,
          targetId: mentorId,
          details: API_RESPONSE.SUCCESS.ADMIN_REJECT_MENTOR.message,
          metadata: { mentorId, reason: dto.reason },
          ipAddress,
          userAgent,
          createdById: adminId,
        },
      });

      this.mailService.sendMentorRejectionEmail(mentor.email, mentor.firstName, dto.reason);

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_REJECT_MENTOR.code,
        message: API_RESPONSE.SUCCESS.ADMIN_REJECT_MENTOR.message,
        data: null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_REJECT_MENTOR.code,
        message: API_RESPONSE.ERROR.ADMIN_REJECT_MENTOR.message,
        data: error,
      };
    }
  }

  async deactivateMentor(mentorId: string, adminId: string, ipAddress: string, userAgent: string): Promise<ResponseDto> {
    try {
      const mentor = await this.prisma.db.user.findFirst({
        where: { id: mentorId, role: UserRole.Mentor },
        select: { id: true, firstName: true, email: true, status: true },
      });

      if (!mentor) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      if (mentor.status !== UserStatus.Approved) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_DEACTIVATE.code,
          message: API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_DEACTIVATE.message,
          data: null,
        };
      }

      await this.prisma.db.user.update({
        where: { id: mentorId },
        data: { status: UserStatus.Inactive, updatedById: adminId },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.AdminDeactivateMentor,
          targetId: mentorId,
          details: API_RESPONSE.SUCCESS.ADMIN_DEACTIVATE_MENTOR.message,
          metadata: { mentorId },
          ipAddress,
          userAgent,
          createdById: adminId,
        },
      });

      this.mailService.sendMentorDeactivationEmail(mentor.email, mentor.firstName);

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_DEACTIVATE_MENTOR.code,
        message: API_RESPONSE.SUCCESS.ADMIN_DEACTIVATE_MENTOR.message,
        data: null,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_DEACTIVATE_MENTOR.code,
        message: API_RESPONSE.ERROR.ADMIN_DEACTIVATE_MENTOR.message,
        data: error,
      };
    }
  }
}
