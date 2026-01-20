import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsyncReturn, AsyncStatus, RETURN_MESSAGES } from '@gurokonekt/models';
import { UpdateMentorProfileDto } from '../../dto/user/mentor';
import { UserStatus } from '@prisma/client';


@Injectable()
export class MentorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @description - Get mentor profile by userId
   * @param userId - The ID of the user whose mentor profile is to be retrieved.
   */
  async getMyMentorProfile(userId: string): Promise<AsyncReturn> {
    try {
      const profile = await this.prisma.db.mentorProfile.findUnique({
        where: { userId },
        include: {
          user: true,
        },
      });

      if (!profile) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.PROFILE_NOT_FOUND,
          data: null,
        };
      }

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.PROFILE_RETRIEVED,
        data: profile,
      };
    } catch (error) {
      console.error('[getMyMentorProfile]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * @description - Update mentor profile (self or admin)
   * @param mentorUserId - The ID of the mentor whose profile is to be updated.
   * @param dto - The update data transfer object containing the new mentor profile information.
   * @param currentUserId - The ID of the current authenticated user.
   * @param adminOverride - If true, admin is updating the profile.
   */
  async updateMentorProfile(
    mentorUserId: string,
    dto: UpdateMentorProfileDto,
    currentUserId: string,
    adminOverride = false,
  ): Promise<AsyncReturn> {
    try {
      if (!adminOverride && mentorUserId !== currentUserId) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.UNAUTHORIZED,
          data: null,
        };
      }

      const updatedProfile = await this.prisma.db.$transaction(async (prisma) => {
        // Update user first if name fields are provided
        if (dto.firstName || dto.middleName || dto.lastName || dto.bio) {
          await prisma.user.update({
            where: { id: mentorUserId },
            data: {
              firstName: dto.firstName,
              middleName: dto.middleName,
              lastName: dto.lastName,
              suffix: dto.suffix,
              country: dto.country,
              language: dto.language,
            },
          });
        }

        // Update mentor profile
        return prisma.mentorProfile.update({
          where: { userId: mentorUserId },
          data: {
            yearsOfExperience: dto.yearsOfExperience,
            linkedInUrl: dto.linkedInUrl,
            bio: dto.bio,
            skills: dto.skills,
            sessionRate: dto.sessionRate,
            availability: dto.availability,
            updatedBy: { connect: { id: currentUserId } },
          },
        });
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.PROFILE_UPDATED,
        data: updatedProfile,
      };
    } catch (error) {
      console.error('[updateMentorProfile]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * @description - Soft delete mentor account
   * @param mentorId - The ID of the mentor whose account is to be deleted.
   * @param currentUserId - The ID of the current authenticated user.
   * @param adminOverride - If true, admin is deleting the account.
   */
  async deleteMentorAccount(
    mentorId: string,
    currentUserId: string,
    adminOverride = false,
  ): Promise<AsyncReturn> {
    try {
      if (!adminOverride && mentorId !== currentUserId) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.UNAUTHORIZED,
          data: null,
        };
      }

      const user = await this.prisma.db.user.findUnique({ 
        where: { id: mentorId } 
      });

      if (!user) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.USER_NOT_FOUND,
          data: null,
        };
      }

      if (user.status === UserStatus.Deleted) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.ACCOUNT_ALREADY_DELETED,
          data: null,
        };
      }

      const updatedUser = await this.prisma.db.user.update({
        where: { id: mentorId },
        data: { status: UserStatus.Deleted },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.ACCOUNT_DELETED,
        data: updatedUser,
      };
    } catch (error) {
      console.error('[deleteMentorAccount]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }
}
