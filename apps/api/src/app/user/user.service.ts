import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { API_RESPONSE, LogsActionType, ResponseDto, ResponseStatus, SelectFields, UpdateMenteeProfileDto, UpdateMentorProfileDto, UpdateUserRoleDto, UpdateUserStatusDto, UserRole } from '@gurokonekt/models';
import { StorageService } from '../storage/storage.service';
import { instanceToPlain } from 'class-transformer';

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
    ipAddress: string, 
    userAgent: string
  ): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`User with ID ${userId} not found`);
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: API_RESPONSE.ERROR.USER_NOT_FOUND.message,
          data: null,
        };
      }

      let profileResponse: any = null;

      if (user.role === UserRole.Mentor) {
        const currentDto = dto as UpdateMentorProfileDto;
        await this.prisma.db.$transaction(async (tx) => {
          profileResponse = await tx.mentorProfile.upsert({
            where: { userId },
            update: {
              bio: currentDto.bio,
              skills: currentDto.skills,
              sessionRate: currentDto.sessionRate,
              availability: instanceToPlain(currentDto.availability),
              updatedById: currentDto.updatedById,
            },
            create: {
              userId,
              bio: currentDto.bio,
              skills: currentDto.skills,
              sessionRate: currentDto.sessionRate,
              availability: instanceToPlain(currentDto.availability),
              updatedById: currentDto.updatedById,
            },
            select: SelectFields.getMentorProfileSelect(),
          });

          await tx.user.update({
            where: { id: userId },
            data: {
              isProfileComplete: true,
              updatedById: currentDto.updatedById,
            },
          });
        });
      } else if (user.role === UserRole.Mentee) {
        const currentDto = dto as UpdateMenteeProfileDto;
        await this.prisma.db.$transaction(async (tx) => {
          profileResponse = await tx.menteeProfile.upsert({
            where: { userId },
            update: {
              bio: currentDto.bio,
              learningGoals: currentDto.learningGoals,
              areasOfInterest: currentDto.areasOfInterest,
              preferredSessionType: currentDto.preferredSessionType,
              availability: instanceToPlain(currentDto.availability),
              updatedById: currentDto.updatedById,
            },
            create: {
              userId,
              bio: currentDto.bio,
              learningGoals: currentDto.learningGoals,
              areasOfInterest: currentDto.areasOfInterest,
              preferredSessionType: currentDto.preferredSessionType,
              availability: instanceToPlain(currentDto.availability),
              updatedById: currentDto.updatedById,
            },
            select: SelectFields.getMenteeProfileSelect(),
          });

          await tx.user.update({
            where: { id: userId },
            data: {
              isProfileComplete: true,
              updatedById: currentDto.updatedById,
            },
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

      let avatarResponse: ResponseDto = null;
      if (avatar && avatar.length > 0) {
        avatarResponse = await this.storageService.uploadAvatar(
          avatar, 
          userId, 
          user.role
        );

        if (user.role === UserRole.Mentor) {
          profileResponse = await this.prisma.db.mentorProfile.findUnique({
            where: { userId },
            select: SelectFields.getMentorProfileSelect(),
          });
        } else {
          profileResponse = await this.prisma.db.menteeProfile.findUnique({
            where: { userId },
            select: SelectFields.getMenteeProfileSelect(),
          });
        }
      }

      const message = avatarResponse?.status === ResponseStatus.Error
      ? `${API_RESPONSE.SUCCESS.UPDATE_USER_PROFILE.message}. ${API_RESPONSE.ERROR.UPLOAD_FILES.message}.`
      : API_RESPONSE.SUCCESS.UPDATE_USER_PROFILE.message;

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.UPDATE_USER_PROFILE.code,
        message: message,
        data: profileResponse,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.UPDATE_USER_PROFILE.code,
        message: API_RESPONSE.ERROR.UPDATE_USER_PROFILE.message,
        data: null,
      };
    }
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
