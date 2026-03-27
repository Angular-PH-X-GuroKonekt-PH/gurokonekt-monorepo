import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { API_RESPONSE, AddAvailabilitySlotDto, BookingStatus, DaysInWeek, DeactivationFeedbackDto, DeleteAvailabilitySlotDto, DowngradeMentorDto, InitiateDeactivationDto, LogsActionType, ManageAvailabilityDto, MentorDashboardInterface, MenteeDashboardInterface, MenteeBookingOverviewInterface, MentorSearchItemInterface, NotificationStatus, NotificationType, REDIRECT_LINKS, ResponseDto, ResponseStatus, SelectFields, SetSessionDurationDto, UpdateMenteeProfileDto, UpdateMentorProfileDto, UpdateUserRoleDto, UpdateUserStatusDto, UserProfileValidator, UserRole, UserStatus, VerifyDeactivationTokenDto } from '@gurokonekt/models';
import { StorageService } from '../storage/storage.service';
import { SupabaseService } from '../supabase/supabase.service';
import { instanceToPlain } from 'class-transformer';
import { MENTOR_DASHBOARD_SHORTCUTS, MENTOR_DASHBOARD_NAV_ITEMS, MENTEE_DASHBOARD_SHORTCUTS, MENTEE_DASHBOARD_NAV_ITEMS } from '@gurokonekt/utils';
import * as crypto from 'crypto';
import bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly supabase: SupabaseService,
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
      const effectiveDto: UpdateMenteeProfileDto | UpdateMentorProfileDto = role === UserRole.Mentee
        ? (() => {
            const currentDto = dto as UpdateMenteeProfileDto;
            const normalizeToArray = (value: unknown): string[] | undefined => {
              if (Array.isArray(value)) return value as string[];
              if (typeof value === 'string' && value.trim().length > 0) return [value];
              return undefined;
            };
            const normalizeAvailability = (value: unknown): UpdateMenteeProfileDto['availability'] => {
              if (Array.isArray(value)) return value;
              if (typeof value === 'string') {
                try {
                  const parsed = JSON.parse(value);
                  return Array.isArray(parsed) ? parsed : undefined;
                } catch {
                  return undefined;
                }
              }
              return undefined;
            };

            return {
              ...currentDto,
              learningGoals: normalizeToArray(currentDto.learningGoals),
              areasOfInterest: normalizeToArray(currentDto.areasOfInterest),
              availability: normalizeAvailability(currentDto.availability),
            };
          })()
        : dto;

      if (!isProfileComplete) {
        try {
          UserProfileValidator.throwIfMissingFields(effectiveDto, user.role as UserRole);
        } catch (err) {
          const validationError = err instanceof Error ? err : new Error(String(err));
          await this.prisma.db.logs.create({
            data: {
              actionType: LogsActionType.Update,
              targetId: userId,
              details: API_RESPONSE.ERROR.MISSING_REQUIRED_FIELDS.message,
              metadata: { dto: instanceToPlain(effectiveDto) },
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

      
      const userUpdateData = UserProfileValidator.buildUserUpdateData(effectiveDto, isProfileComplete);

      let profileResponse: Record<string, unknown> | null = null;

      if (role === UserRole.Mentor) {
        const payload = UserProfileValidator.buildProfilePayload(effectiveDto, role, isProfileComplete);
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
        const userUpdateData = UserProfileValidator.buildUserUpdateData(effectiveDto, isProfileComplete);
        const currentDto = effectiveDto as UpdateMenteeProfileDto;
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
          createdById: effectiveDto.updatedById,
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
      this.logger.error(`Profile update failed: ${err.message}`, err.stack);
      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.Update,
          targetId: userId,
          details: `Profile update error: ${err.message}`,
          metadata: { error: err.message, stack: err.stack },
          ipAddress,
          userAgent,
          createdById: userId,
        },
      }).catch(() => undefined); // Silently ignore log errors
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.UPDATE_USER_PROFILE.code,
        message: `Failed to update user profile: ${err.message}`,
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

  // ====================================================
  // ACCOUNT DEACTIVATION
  // ====================================================

  async initiateDeactivation(
    userId: string,
    dto: InitiateDeactivationDto,
    ipAddress: string,
    userAgent: string,
    origin: string,
  ): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, hashPassword: true },
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

      const isPasswordValid = await bcrypt.compare(dto.password, user.hashPassword);
      if (!isPasswordValid) {
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.DeactivateAccount,
            targetId: userId,
            details: 'Deactivation initiation failed: incorrect password',
            metadata: { userId },
            ipAddress,
            userAgent,
            createdById: userId,
          },
        });
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.PASSWORD_INCORRECT.code,
          message: API_RESPONSE.ERROR.PASSWORD_INCORRECT.message,
          data: null,
        };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.prisma.db.user.update({
        where: { id: userId },
        data: { deactivationToken: token, deactivationTokenExpiresAt: expiresAt },
      });

      const redirectTo = `${origin}${REDIRECT_LINKS.DEACTIVATE_ACCOUNT}?token=${token}`;
      const { error } = await this.supabase.client.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });

      if (error) {
        this.logger.error(error.message, error);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.DEACTIVATION_INITIATE.code,
          message: API_RESPONSE.ERROR.DEACTIVATION_INITIATE.message,
          data: null,
        };
      }

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.DeactivateAccount,
          targetId: userId,
          details: 'Deactivation initiated',
          metadata: { userId },
          ipAddress,
          userAgent,
          createdById: userId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.DEACTIVATION_INITIATED.code,
        message: API_RESPONSE.SUCCESS.DEACTIVATION_INITIATED.message,
        data: null,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.DEACTIVATION_INITIATE.code,
        message: API_RESPONSE.ERROR.DEACTIVATION_INITIATE.message,
        data: null,
      };
    }
  }

  async verifyDeactivationToken(dto: VerifyDeactivationTokenDto): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findFirst({
        where: { deactivationToken: dto.token },
        select: { id: true, deactivationTokenExpiresAt: true },
      });

      if (!user) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.DEACTIVATION_TOKEN_INVALID.code,
          message: API_RESPONSE.ERROR.DEACTIVATION_TOKEN_INVALID.message,
          data: null,
        };
      }

      if (!user.deactivationTokenExpiresAt || user.deactivationTokenExpiresAt < new Date()) {
        await this.prisma.db.user.update({
          where: { id: user.id },
          data: { deactivationToken: null, deactivationTokenExpiresAt: null },
        });
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.DEACTIVATION_TOKEN_INVALID.code,
          message: API_RESPONSE.ERROR.DEACTIVATION_TOKEN_INVALID.message,
          data: null,
        };
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.DEACTIVATION_TOKEN_VALID.code,
        message: API_RESPONSE.SUCCESS.DEACTIVATION_TOKEN_VALID.message,
        data: { userId: user.id },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.DEACTIVATION_CONFIRM.code,
        message: API_RESPONSE.ERROR.DEACTIVATION_CONFIRM.message,
        data: null,
      };
    }
  }

  async submitDeactivationFeedback(
    userId: string,
    dto: DeactivationFeedbackDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findFirst({
        where: { id: userId, deactivationToken: dto.token },
        select: { id: true, deactivationTokenExpiresAt: true },
      });

      if (!user || !user.deactivationTokenExpiresAt || user.deactivationTokenExpiresAt < new Date()) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.DEACTIVATION_TOKEN_INVALID.code,
          message: API_RESPONSE.ERROR.DEACTIVATION_TOKEN_INVALID.message,
          data: null,
        };
      }

      await this.prisma.db.$transaction(async (tx) => {
        await tx.deactivationFeedback.upsert({
          where: { userId },
          update: { reason: dto.reason },
          create: { userId, reason: dto.reason },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            status: UserStatus.Inactive,
            deactivationToken: null,
            deactivationTokenExpiresAt: null,
          },
        });
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.DeactivateAccount,
          targetId: userId,
          details: 'Account deactivated',
          metadata: { userId },
          ipAddress,
          userAgent,
          createdById: userId,
        },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ACCOUNT_DEACTIVATED.code,
        message: API_RESPONSE.SUCCESS.ACCOUNT_DEACTIVATED.message,
        data: null,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ACCOUNT_DEACTIVATION_FAILED.code,
        message: API_RESPONSE.ERROR.ACCOUNT_DEACTIVATION_FAILED.message,
        data: null,
      };
    }
  }

  // ====================================================
  // MENTOR DOWNGRADE
  // ====================================================

  async downgradeMentorToMentee(userId: string, requesterId: string, dto: DowngradeMentorDto): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, hashPassword: true } });
      if (!user) {
        return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code, message: API_RESPONSE.ERROR.USER_NOT_FOUND.message, data: null };
      }
      if (user.role !== UserRole.Mentor && requesterId !== userId) {
        return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.MENTOR_DOWNGRADE_NOT_MENTOR.code, message: API_RESPONSE.ERROR.MENTOR_DOWNGRADE_NOT_MENTOR.message, data: null };
      }

      const passwordMatch = await bcrypt.compare(dto.password, user.hashPassword);
      if (!passwordMatch) {
        return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.PASSWORD_INCORRECT.code, message: API_RESPONSE.ERROR.PASSWORD_INCORRECT.message, data: null };
      }

      await this.prisma.db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            role: UserRole.Mentee,
            status: UserStatus.Active,
            isMentorApproved: false,
            isMentorProfileComplete: false,
          },
        });
        await tx.mentorProfile.deleteMany({ where: { userId } });
        await tx.notification.create({
          data: {
            userId,
            title: 'Account Downgraded',
            message: 'Your mentor account has been downgraded to a mentee account. Your mentor profile has been removed.',
            type: NotificationType.ANNOUNCEMENT,
            status: NotificationStatus.UNREAD,
          },
        });
      });

      await this.supabase.clientAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: (await this.prisma.db.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? '',
        options: { data: { notification: 'mentor_downgraded' } },
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.MENTOR_DOWNGRADED.code,
        message: API_RESPONSE.SUCCESS.MENTOR_DOWNGRADED.message,
        data: null,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.MENTOR_DOWNGRADE_FAILED.code, message: API_RESPONSE.ERROR.MENTOR_DOWNGRADE_FAILED.message, data: null };
    }
  }

  // ====================================================
  // AVAILABILITY MANAGEMENT
  // ====================================================

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private framesOverlap(a: { from: string; to: string }, b: { from: string; to: string }): boolean {
    return this.timeToMinutes(a.from) < this.timeToMinutes(b.to) && this.timeToMinutes(b.from) < this.timeToMinutes(a.to);
  }

  private validateTimeFrames(frames: { from: string; to: string }[]): string | null {
    for (const f of frames) {
      if (this.timeToMinutes(f.from) >= this.timeToMinutes(f.to)) return `${f.from}–${f.to}`;
    }
    for (let i = 0; i < frames.length; i++) {
      for (let j = i + 1; j < frames.length; j++) {
        if (this.framesOverlap(frames[i], frames[j])) return `${frames[i].from}–${frames[i].to} overlaps ${frames[j].from}–${frames[j].to}`;
      }
    }
    return null;
  }

  private async requireApprovedMentor(userId: string, requesterId: string): Promise<{ error: ResponseDto | null }> {
    const profile = await this.prisma.db.mentorProfile.findUnique({ where: { userId }, select: { userId: true } });
    const user = await this.prisma.db.user.findUnique({ where: { id: userId }, select: { role: true, status: true, isMentorApproved: true } });
    if (!user || !profile) return { error: { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code, message: API_RESPONSE.ERROR.USER_NOT_FOUND.message, data: null } };
    const isAdmin = (await this.prisma.db.user.findUnique({ where: { id: requesterId }, select: { role: true } }))?.role === UserRole.Admin;
    if (!isAdmin && user.role !== UserRole.Mentor) return { error: { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.MENTOR_DOWNGRADE_NOT_MENTOR.code, message: API_RESPONSE.ERROR.MENTOR_DOWNGRADE_NOT_MENTOR.message, data: null } };
    if (!isAdmin && !user.isMentorApproved) return { error: { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.MENTOR_NOT_APPROVED.code, message: API_RESPONSE.ERROR.MENTOR_NOT_APPROVED.message, data: null } };
    return { error: null };
  }

  async setSessionDuration(userId: string, requesterId: string, dto: SetSessionDurationDto): Promise<ResponseDto> {
    try {
      const { error } = await this.requireApprovedMentor(userId, requesterId);
      if (error) return error;
      await this.prisma.db.mentorProfile.update({ where: { userId }, data: { sessionDurationMinutes: dto.sessionDurationMinutes } });
      return { status: ResponseStatus.Success, statusCode: API_RESPONSE.SUCCESS.UPDATE_SESSION_DURATION.code, message: API_RESPONSE.SUCCESS.UPDATE_SESSION_DURATION.message, data: { sessionDurationMinutes: dto.sessionDurationMinutes } };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.SET_SESSION_DURATION_FAILED.code, message: API_RESPONSE.ERROR.SET_SESSION_DURATION_FAILED.message, data: null };
    }
  }

  async getMentorAvailability(userId: string): Promise<ResponseDto> {
    try {
      const profile = await this.prisma.db.mentorProfile.findUnique({ where: { userId }, select: { availability: true, sessionDurationMinutes: true } });
      if (!profile) return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code, message: API_RESPONSE.ERROR.USER_NOT_FOUND.message, data: null };
      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_AVAILABILITY.code,
        message: API_RESPONSE.SUCCESS.GET_AVAILABILITY.message,
        data: { sessionDurationMinutes: profile.sessionDurationMinutes, availability: profile.availability },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.GET_AVAILABILITY_FAILED.code, message: API_RESPONSE.ERROR.GET_AVAILABILITY_FAILED.message, data: null };
    }
  }

  async updateMentorAvailability(userId: string, requesterId: string, dto: ManageAvailabilityDto): Promise<ResponseDto> {
    try {
      const { error } = await this.requireApprovedMentor(userId, requesterId);
      if (error) return error;

      const days = dto.availability.map(e => e.day);
      if (new Set(days).size !== days.length) {
        return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.AVAILABILITY_DUPLICATE_DAY.code, message: API_RESPONSE.ERROR.AVAILABILITY_DUPLICATE_DAY.message, data: null };
      }

      for (const entry of dto.availability) {
        const frameErr = this.validateTimeFrames(entry.timeFrames);
        if (frameErr) return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.AVAILABILITY_INVALID_RANGE.code, message: `${API_RESPONSE.ERROR.AVAILABILITY_INVALID_RANGE.message} (${entry.day}): ${frameErr}`, data: null };

        for (const f of entry.timeFrames) {
          const frameMins = this.timeToMinutes(f.to) - this.timeToMinutes(f.from);
          if (frameMins < dto.sessionDurationMinutes) {
            return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.AVAILABILITY_FRAME_TOO_SHORT.code, message: `${API_RESPONSE.ERROR.AVAILABILITY_FRAME_TOO_SHORT.message}: ${f.from}–${f.to} is shorter than ${dto.sessionDurationMinutes} min`, data: null };
          }
        }
      }

      await this.prisma.db.mentorProfile.update({
        where: { userId },
        data: { sessionDurationMinutes: dto.sessionDurationMinutes, availability: JSON.parse(JSON.stringify(dto.availability)) },
      });
      return { status: ResponseStatus.Success, statusCode: API_RESPONSE.SUCCESS.UPDATE_AVAILABILITY.code, message: API_RESPONSE.SUCCESS.UPDATE_AVAILABILITY.message, data: { sessionDurationMinutes: dto.sessionDurationMinutes, availability: dto.availability } };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.UPDATE_AVAILABILITY_FAILED.code, message: API_RESPONSE.ERROR.UPDATE_AVAILABILITY_FAILED.message, data: null };
    }
  }

  async addAvailabilitySlot(userId: string, requesterId: string, dto: AddAvailabilitySlotDto): Promise<ResponseDto> {
    try {
      const { error } = await this.requireApprovedMentor(userId, requesterId);
      if (error) return error;

      const profile = await this.prisma.db.mentorProfile.findUnique({ where: { userId }, select: { availability: true, sessionDurationMinutes: true } });
      const duration = dto.sessionDurationMinutes ?? profile?.sessionDurationMinutes ?? 60;
      const current = (profile?.availability as { day: DaysInWeek; timeFrames: { from: string; to: string }[] }[] | null) ?? [];

      // Validate the new frames themselves
      const frameErr = this.validateTimeFrames(dto.timeFrames);
      if (frameErr) return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.AVAILABILITY_INVALID_RANGE.code, message: `${API_RESPONSE.ERROR.AVAILABILITY_INVALID_RANGE.message}: ${frameErr}`, data: null };

      // Each new frame must be long enough for at least one session
      for (const f of dto.timeFrames) {
        const frameMins = this.timeToMinutes(f.to) - this.timeToMinutes(f.from);
        if (frameMins < duration) {
          return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.AVAILABILITY_FRAME_TOO_SHORT.code, message: `${API_RESPONSE.ERROR.AVAILABILITY_FRAME_TOO_SHORT.message}: ${f.from}–${f.to} is shorter than ${duration} min`, data: null };
        }
      }

      // Merge new frames with existing frames for this day and check for overlaps
      const existingDay = current.find(s => s.day === dto.day);
      const existingFrames = existingDay?.timeFrames ?? [];
      const mergedFrames = [...existingFrames, ...dto.timeFrames];
      const overlapErr = this.validateTimeFrames(mergedFrames);
      if (overlapErr) return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.AVAILABILITY_OVERLAP.code, message: `${API_RESPONSE.ERROR.AVAILABILITY_OVERLAP.message}: ${overlapErr}`, data: null };

      const updated = existingDay
        ? current.map(s => s.day === dto.day ? { ...s, timeFrames: mergedFrames } : s)
        : [...current, { day: dto.day, timeFrames: dto.timeFrames }];

      const updateData: Record<string, unknown> = { availability: JSON.parse(JSON.stringify(updated)) };
      if (dto.sessionDurationMinutes !== undefined) updateData['sessionDurationMinutes'] = dto.sessionDurationMinutes;

      await this.prisma.db.mentorProfile.update({ where: { userId }, data: updateData });
      return { status: ResponseStatus.Success, statusCode: API_RESPONSE.SUCCESS.ADD_AVAILABILITY_SLOT.code, message: API_RESPONSE.SUCCESS.ADD_AVAILABILITY_SLOT.message, data: { sessionDurationMinutes: duration, availability: updated } };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.ADD_AVAILABILITY_SLOT_FAILED.code, message: API_RESPONSE.ERROR.ADD_AVAILABILITY_SLOT_FAILED.message, data: null };
    }
  }

  async deleteAvailabilitySlot(userId: string, requesterId: string, dto: DeleteAvailabilitySlotDto): Promise<ResponseDto> {
    try {
      const { error } = await this.requireApprovedMentor(userId, requesterId);
      if (error) return error;

      const profile = await this.prisma.db.mentorProfile.findUnique({ where: { userId }, select: { availability: true, sessionDurationMinutes: true } });
      let current = (profile?.availability as { day: DaysInWeek; timeFrames: { from: string; to: string }[] }[] | null) ?? [];
      const dayEntry = current.find(s => s.day === dto.day);
      if (!dayEntry) return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.AVAILABILITY_SLOT_NOT_FOUND.code, message: API_RESPONSE.ERROR.AVAILABILITY_SLOT_NOT_FOUND.message, data: null };

      if (dto.timeFrameIndex !== undefined) {
        const newFrames = dayEntry.timeFrames.filter((_, i) => i !== dto.timeFrameIndex);
        current = newFrames.length === 0 ? current.filter(s => s.day !== dto.day) : current.map(s => s.day === dto.day ? { ...s, timeFrames: newFrames } : s);
      } else {
        current = current.filter(s => s.day !== dto.day);
      }

      await this.prisma.db.mentorProfile.update({ where: { userId }, data: { availability: JSON.parse(JSON.stringify(current)) } });
      return { status: ResponseStatus.Success, statusCode: API_RESPONSE.SUCCESS.DELETE_AVAILABILITY_SLOT.code, message: API_RESPONSE.SUCCESS.DELETE_AVAILABILITY_SLOT.message, data: { sessionDurationMinutes: profile?.sessionDurationMinutes, availability: current } };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(err.message, err.stack);
      return { status: ResponseStatus.Error, statusCode: API_RESPONSE.ERROR.DELETE_AVAILABILITY_SLOT_FAILED.code, message: API_RESPONSE.ERROR.DELETE_AVAILABILITY_SLOT_FAILED.message, data: null };
    }
  }
}
