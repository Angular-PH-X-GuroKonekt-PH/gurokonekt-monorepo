import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsyncReturn, AsyncStatus, RETURN_MESSAGES, UserStatus } from '@gurokonekt/models';
import { UpdateMenteeProfileDto } from '../../dto/user/mentee';


@Injectable()
export class MenteeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get mentee profile
   * @param menteeId - current authenticated user's ID
   */
  async getProfile(menteeId: string): Promise<AsyncReturn> {
    try {
      const profile = await this.prisma.db.menteeProfile.findUnique({
        where: { userId: menteeId },
        include: { user: true },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.GET_PROFILE,
        data: profile,
      };
    } catch (error) {
      console.error('[getProfile]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * Update mentee profile
   * @param menteeId - current authenticated user's ID
   * @param data - fields to update in profile
   */
  async updateProfile(
    menteeId: string, 
    dto: UpdateMenteeProfileDto
  ): Promise<AsyncReturn> {
    try {
      // Check if profile exists
      const profile = await this.prisma.db.menteeProfile.findUnique({
        where: { userId: menteeId },
      });

      if (!profile) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.USER_NOT_FOUND,
          data: null,
        }
      };

      // Update both User and MenteeProfile
      const updatedProfile = await this.prisma.db.$transaction(async (prisma) => {
        // Update User table fields (firstName, lastName, etc.)
        if (dto.firstName || dto.middleName || dto.lastName || dto.bio) {
          await prisma.user.update({
            where: { id: menteeId },
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

        // Update MenteeProfile fields
        return prisma.menteeProfile.update({
          where: { userId: menteeId },
          data: {
            bio: dto.bio,
            learningGoals: dto.learningGoals,
            areasOfInterest: dto.areasOfInterest,
            preferredSessionType: dto.preferredSessionType,
            availability: dto.availability,
          },
        });
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.PROFILE_UPDATED,
        data: updatedProfile,
      };
    } catch (error) {
      console.error('[updateProfile]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * Soft-delete mentee account
   * @param menteeId - id of user to delete
   * @param currentUserId - current authenticated user's ID
   * @param adminOverride - if true, admin is deleting account
   */
  async deleteAccount(
    menteeId: string, 
    currentUserId: string, 
    adminOverride = false
  ): Promise<AsyncReturn> {
    try {
      if (!adminOverride && menteeId !== currentUserId) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.UNAUTHORIZED,
          data: null,
        };
      }

      const user = await this.prisma.db.user.findUnique({
        where: { id: menteeId },
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
        where: { id: menteeId },
        data: { status: UserStatus.Deleted },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.ACCOUNT_DELETED,
        data: updatedUser,
      };
    } catch (error) {
      console.error('[deleteAccount]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }
}
