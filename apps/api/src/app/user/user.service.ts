import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { API_RESPONSE, BookingStatus, LogsActionType, MentorDashboardInterface, MenteeDashboardInterface, MenteeBookingOverviewInterface, MentorSearchItemInterface, ResponseDto, ResponseStatus, SelectFields, UpdateMenteeProfileDto, UpdateMentorProfileDto, UpdateUserRoleDto, UpdateUserStatusDto, UserProfileValidator, UserRole, UserStatus } from '@gurokonekt/models';
import { StorageService } from '../storage/storage.service';
import { instanceToPlain } from 'class-transformer';
import { MENTOR_DASHBOARD_SHORTCUTS, MENTOR_DASHBOARD_NAV_ITEMS, MENTEE_DASHBOARD_SHORTCUTS, MENTEE_DASHBOARD_NAV_ITEMS } from '@gurokonekt/utils';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // ====================================================
  // GET
  // ====================================================

  async getUserProfileById(
    userId: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<ResponseDto> { 
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
        select: SelectFields.getUserCredentialsSelect(),
      });

      if (!user) {
        this.logger.error(`User with ID ${userId} not found`);
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.Read,
            targetId: userId,
            details: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
            metadata: { userId: userId },
            ipAddress,
            userAgent,
            createdById: userId,
          },
        });
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.Read,
          targetId: userId,
          details: API_RESPONSE.SUCCESS.GET_USER_PROFILE.message,
          metadata: { user: { ...user } },
          ipAddress,
          userAgent,
          createdById: userId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_USER_PROFILE.code,
        message: API_RESPONSE.SUCCESS.GET_USER_PROFILE.message,
        data: user,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.Read,
          targetId: userId,
          details: API_RESPONSE.ERROR.GET_USER_PROFILE.message,
          metadata: { error: err.message },
          ipAddress,
          userAgent,
          createdById: userId,
        },
      });
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_USER_PROFILE.code,
        message: API_RESPONSE.ERROR.GET_USER_PROFILE.message,
        data: null,
      };
    }
  }

  /**
   * Unified Dashboard dispatcher — looks up the user's role and delegates
   * to getMentorDashboard or getMenteeDashboard automatically.
   */
  async getUserDashboard(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ResponseDto> {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
        message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
        data: null,
      };
    }

    if (user.role === UserRole.Mentor) {
      return this.getMentorDashboard(userId, ipAddress, userAgent);
    }

    if (user.role === UserRole.Mentee) {
      return this.getMenteeDashboard(userId, ipAddress, userAgent);
    }

    return {
      status: ResponseStatus.Error,
      statusCode: API_RESPONSE.ERROR.MENTEE_ACCESS_DENIED.code,
      message: 'Dashboard is not available for this role',
      data: null,
    };
  }

  /**
   * Mentor Dashboard
   * Access guard (in-service):
   *  - role must be Mentor
   *  - isMentorApproved must be true
   *  - isMentorProfileComplete must be true
   *  - status must not be banned / suspended / deleted / rejected
   *
   * Returns: greeting, quickStats (pending/upcoming/completed bookings),
   *          shortcuts, and nav items.
   */
  async getMentorDashboard(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
        select: SelectFields.getUserCredentialsSelect(),
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      // Role check
      if (user.role !== UserRole.Mentor) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTOR_NOT_APPROVED.code,
          message: API_RESPONSE.ERROR.MENTOR_NOT_APPROVED.message,
          data: null,
        };
      }

      // Approval and account standing check
      const blockedStatuses = [
        UserStatus.Banned,
        UserStatus.Suspended,
        UserStatus.Deleted,
        UserStatus.Rejected,
      ];
      if (!user.isMentorApproved || blockedStatuses.includes(user.status as UserStatus)) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTOR_NOT_APPROVED.code,
          message: API_RESPONSE.ERROR.MENTOR_NOT_APPROVED.message,
          data: null,
        };
      }

      // Profile completeness check
      if (!user.isMentorProfileComplete) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTOR_PROFILE_INCOMPLETE.code,
          message: API_RESPONSE.ERROR.MENTOR_PROFILE_INCOMPLETE.message,
          data: null,
        };
      }

      // Quick Stats — three parallel count queries
      const now = new Date();
      const [pendingBookingRequestsCount, upcomingSessions, totalCompletedSessions] =
        await Promise.all([
          this.prisma.db.booking.count({
            where: { mentorId: userId, status: BookingStatus.PENDING, isDeleted: false },
          }),
          this.prisma.db.booking.count({
            where: {
              mentorId: userId,
              status: BookingStatus.APPROVED,
              sessionDateTime: { gte: now },
              isDeleted: false,
            },
          }),
          this.prisma.db.booking.count({
            where: { mentorId: userId, status: BookingStatus.COMPLETED, isDeleted: false },
          }),
        ]);

      const dashboard: MentorDashboardInterface = {
        greeting: `Welcome back, ${user.firstName}!`,
        quickStats: {
          pendingBookingRequestsCount,
          upcomingSessions,
          totalCompletedSessions,
        },
        shortcuts: MENTOR_DASHBOARD_SHORTCUTS,
        navItems: MENTOR_DASHBOARD_NAV_ITEMS,
      };

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.Read,
          targetId: userId,
          details: API_RESPONSE.SUCCESS.GET_MENTOR_DASHBOARD.message,
          metadata: { userId },
          ipAddress,
          userAgent,
          createdById: userId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_MENTOR_DASHBOARD.code,
        message: API_RESPONSE.SUCCESS.GET_MENTOR_DASHBOARD.message,
        data: dashboard,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_MENTOR_DASHBOARD.code,
        message: API_RESPONSE.ERROR.GET_MENTOR_DASHBOARD.message,
        data: null,
      };
    }
  }

  /**
   * Mentee Dashboard
   * Access guard (in-service):
   *  - role must be Mentee
   *  - status must not be banned / suspended / deleted / rejected
   *
   * Returns: greeting, summaryWidgets (upcomingSessions, sessionHistory, recommendedMentors),
   *          shortcuts, and nav items.
   */
  async getMenteeDashboard(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
        select: SelectFields.getUserCredentialsSelect(),
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      if (user.role !== UserRole.Mentee) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTEE_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.MENTEE_ACCESS_DENIED.message,
          data: null,
        };
      }

      const blockedStatuses = [
        UserStatus.Banned,
        UserStatus.Suspended,
        UserStatus.Deleted,
        UserStatus.Rejected,
      ];
      if (blockedStatuses.includes(user.status as UserStatus)) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.MENTEE_ACCESS_DENIED.code,
          message: API_RESPONSE.ERROR.MENTEE_ACCESS_DENIED.message,
          data: null,
        };
      }

      const now = new Date();

      // Load mentee's areas of interest for recommendation matching
      const menteeProfile = await this.prisma.db.menteeProfile.findUnique({
        where: { userId },
        select: { areasOfInterest: true },
      });

      const areasOfInterest = menteeProfile?.areasOfInterest ?? [];

      // Three parallel queries: upcoming count, session history, recommended mentors
      const [upcomingSessions, sessionHistory, recommendedMentors] = await Promise.all([
        this.prisma.db.booking.count({
          where: {
            menteeId: userId,
            status: BookingStatus.APPROVED,
            sessionDateTime: { gte: now },
            isDeleted: false,
          },
        }),
        this.prisma.db.booking.findMany({
          where: { menteeId: userId, status: BookingStatus.COMPLETED, isDeleted: false },
          orderBy: { sessionDateTime: 'desc' },
          take: 5,
          select: {
            id: true,
            mentorId: true,
            sessionDateTime: true,
            status: true,
            sessionLink: true,
            notes: true,
            mentor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarAttachments: { select: { publicUrl: true } },
              },
            },
          },
        }),
        this.prisma.db.user.findMany({
          where: {
            role: UserRole.Mentor,
            isMentorApproved: true,
            isMentorProfileComplete: true,
            status: UserStatus.Approved,
            ...(areasOfInterest.length > 0 && {
              mentorProfiles: {
                some: { areasOfExpertise: { hasSome: areasOfInterest } },
              },
            }),
          },
          select: SelectFields.getMentorSearchSelect(),
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const dashboard: MenteeDashboardInterface = {
        greeting: `Welcome back, ${user.firstName}!`,
        summaryWidgets: {
          upcomingSessions,
          sessionHistory: sessionHistory as unknown as MenteeDashboardInterface['summaryWidgets']['sessionHistory'],
          recommendedMentors: recommendedMentors as unknown as MentorSearchItemInterface[],
        },
        shortcuts: MENTEE_DASHBOARD_SHORTCUTS,
        navItems: MENTEE_DASHBOARD_NAV_ITEMS,
      };

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.Read,
          targetId: userId,
          details: API_RESPONSE.SUCCESS.GET_MENTEE_DASHBOARD.message,
          metadata: { userId },
          ipAddress,
          userAgent,
          createdById: userId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_MENTEE_DASHBOARD.code,
        message: API_RESPONSE.SUCCESS.GET_MENTEE_DASHBOARD.message,
        data: dashboard,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_MENTEE_DASHBOARD.code,
        message: API_RESPONSE.ERROR.GET_MENTEE_DASHBOARD.message,
        data: null,
      };
    }
  }

  /**
   * Mentee Booking Overview — summarized booking counts for the dashboard widget.
   */
  async getMenteeBookingOverview(userId: string): Promise<ResponseDto> {
    try {
      const now = new Date();

      const [total, upcoming, completed, pending] = await Promise.all([
        this.prisma.db.booking.count({
          where: { menteeId: userId, isDeleted: false },
        }),
        this.prisma.db.booking.count({
          where: {
            menteeId: userId,
            status: BookingStatus.APPROVED,
            sessionDateTime: { gte: now },
            isDeleted: false,
          },
        }),
        this.prisma.db.booking.count({
          where: { menteeId: userId, status: BookingStatus.COMPLETED, isDeleted: false },
        }),
        this.prisma.db.booking.count({
          where: { menteeId: userId, status: BookingStatus.PENDING, isDeleted: false },
        }),
      ]);

      const overview: MenteeBookingOverviewInterface = { total, upcoming, completed, pending };

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_MENTEE_BOOKING_OVERVIEW.code,
        message: API_RESPONSE.SUCCESS.GET_MENTEE_BOOKING_OVERVIEW.message,
        data: overview,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.GET_MENTEE_BOOKING_OVERVIEW.code,
        message: API_RESPONSE.ERROR.GET_MENTEE_BOOKING_OVERVIEW.message,
        data: null,
      };
    }
  }

  // ====================================================
  // POST
  // ====================================================

  // ====================================================
  // PATCH
  // ====================================================

  /**
   * @description - This will update the user profile base on the user role
   * @flow -
   * 1. check if user exist in user table
   * 2. if error save log, return error else continue
   * 3. check user role if mentor go to step 4 else go to step 6
   * 4. save user profile to mentor profile table and update the isProfileComplete flag to true in users table
   * 5. if error save log, return error else go to step 8
   * 6. save user profile to mentee profile table and update the isProfileComplete flag to true in users table
   * 7. if error save log, return error else go to step 8
   * 8. save activity to logs
   * 9. upload avatar to supabase storage using storage service
   * 10. wait for the upload to complete
   * 11. if error on upload save log, return success but with message there is an error uploading avatar please try again later
   * */ 
  async updateUserProfile(
    userId: string,
    dto: UpdateMenteeProfileDto | UpdateMentorProfileDto, 
    avatar: Express.Multer.File[],
    files: Express.Multer.File[],
    ipAddress: string, 
    userAgent: string
  ): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
        select: SelectFields.getUserCredentialsSelect(),
      });

      if (!user) {
        this.logger.error(`User with ID ${userId} not found`);
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.Read,
            targetId: userId,
            details: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
            metadata: { userId: userId },
            ipAddress,
            userAgent,
            createdById: userId,
          },
        });
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      const isProfileComplete = user.isProfileComplete;
      const role = user.role as UserRole;

      if (!isProfileComplete) {
        try {
          UserProfileValidator.throwIfMissingFields(dto, user.role as UserRole);
        } catch (err) {
          const validationError = err instanceof Error ? err : new Error(String(err));
          await this.prisma.db.logs.create({
            data: {
              actionType: LogsActionType.Update,
              targetId: userId,
              details: API_RESPONSE.ERROR.MISSING_REQUIRED_FIELDS.message,
              metadata: { dto: instanceToPlain(dto) },
              ipAddress,
              userAgent,
              createdById: userId,
            },
          });
          return {
            status: ResponseStatus.Error,
            statusCode: API_RESPONSE.ERROR.MISSING_REQUIRED_FIELDS.code,
            message: `${API_RESPONSE.ERROR.MISSING_REQUIRED_FIELDS.message}: ${validationError.message}`,
            data: null,
          };
        }
      }

      
      const userUpdateData = UserProfileValidator.buildUserUpdateData(dto, isProfileComplete);

      let profileResponse: Record<string, unknown> | null = null;

      if (role === UserRole.Mentor) {
        const payload = UserProfileValidator.buildProfilePayload(dto, role, isProfileComplete);
        await this.prisma.db.$transaction(async (tx) => {
          profileResponse = await tx.mentorProfile.upsert({
            where: { userId },
            update: payload,
            create: {
              userId,
              ...payload
            },
            select: SelectFields.getMentorProfileSelect(),
          });

          await tx.user.update({
            where: { id: userId },
            data: userUpdateData,
          });
        });
      } else if (role === UserRole.Mentee) {
        const userUpdateData = UserProfileValidator.buildUserUpdateData(dto, isProfileComplete);
        const currentDto = dto as UpdateMenteeProfileDto;
        const payload = {
          bio: currentDto.bio,
          learningGoals: currentDto.learningGoals,
          areasOfInterest: currentDto.areasOfInterest,
          preferredSessionType: currentDto.preferredSessionType,
          availability: instanceToPlain(currentDto.availability),
          updatedById: currentDto.updatedById,
        };
        await this.prisma.db.$transaction(async (tx) => {
          profileResponse = await tx.menteeProfile.upsert({
            where: { userId },
            update: payload,
            create: {
              userId,
              ...payload
            },
            select: SelectFields.getMenteeProfileSelect(),
          });

          await tx.user.update({
            where: { id: userId },
            data: userUpdateData,
          });
        });
      }

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.Update,
          targetId: userId,
          details: `${API_RESPONSE.SUCCESS.UPDATE_USER_PROFILE.message} for ${user.role}`,
          ipAddress: ipAddress,
          userAgent: userAgent,
          createdById: dto.updatedById,
        },
      });

      const { 
        avatarResponse, 
        documentResponse,
        profileResponse: updatedProfile 
      } = await this.uploadFilesAndFetchProfile(userId, avatar, files, role);
    
      let message = API_RESPONSE.SUCCESS.UPDATE_USER_PROFILE.message;
      if (avatarResponse?.status === ResponseStatus.Error) message += `\n${API_RESPONSE.ERROR.UPLOAD_AVATAR.message}.`;
      if (documentResponse?.status === ResponseStatus.Error) message += `\n${API_RESPONSE.ERROR.UPLOAD_FILES.message}.`;

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPDATE_USER_PROFILE.code,
        message: message,
        data: updatedProfile || profileResponse
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.UPDATE_USER_PROFILE.code,
        message: API_RESPONSE.ERROR.UPDATE_USER_PROFILE.message,
        data: null,
      };
    }
  }

  async uploadFilesAndFetchProfile(userId: string, avatar: Express.Multer.File[], files: Express.Multer.File[], role: UserRole) {
    let avatarResponse: ResponseDto | null = null;
    let documentResponse: ResponseDto | null = null;
    let profileResponse: Record<string, unknown> | null = null;

    if (avatar?.length) {
      avatarResponse = await this.storageService.uploadAvatar(avatar, userId, role);
      profileResponse = await (role === UserRole.Mentor
        ? this.prisma.db.mentorProfile.findUnique({ where: { userId }, select: SelectFields.getMentorProfileSelect() })
        : this.prisma.db.menteeProfile.findUnique({ where: { userId }, select: SelectFields.getMenteeProfileSelect() })
      );
    }

    if (files?.length) {
      documentResponse = await this.storageService.uploadDocument(files, userId, role);
    }

    return { avatarResponse, documentResponse, profileResponse };
  }

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
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
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
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(err.message, err.stack);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.UPDATE_USER_ROLE.code,
          message: API_RESPONSE.ERROR.UPDATE_USER_ROLE.message,
          data: null,
        };
      }
    }
}
