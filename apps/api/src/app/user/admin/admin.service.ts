import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsyncReturn, AsyncStatus, RETURN_MESSAGES } from '@gurokonekt/models';
import { UserRole } from '@prisma/client';
import { 
  CreateUserDto,
  CreateMenteeProfileDto,
  CreateMentorProfileDto, 
  UpdateUserStatusDto,
  UpdateUserRoleDto,
} from '../../dto/user/admin';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @description - Create a new user. Call this endpoint to create a new user upon successfull signup.
   * @authId - Auth Id of user from getting user auth information
   * @dto - Data transfer object containing user information
   * @returns - Async return object containing user information
   * */ 
  async createUser(
    authId: string,
    dto: CreateUserDto,
  ): Promise<AsyncReturn> {
    try {
      const user = await this.prisma.db.user.create({
        data: {
          id: authId,
          firstName: dto.firstName,
          middleName: dto.middleName ?? null,
          lastName: dto.lastName,
          suffix: dto.suffix ?? null,
          email: dto.email,
          role: dto.role,
          status: dto.status,

          createdBy: { connect: { id: authId } },
          updatedBy: { connect: { id: authId } },
        },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.USER_CREATED,
        data: user,
      };
    } catch (error) {
      console.error('[Admin.createUser]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * @description - Create a new mentee profile. Call this endpoint to create a new mentee profile upon successful creating user.
   * @userId - Id from the created user.
   * @dto - Data transfer object containing mentee profile information
   * @returns - Async return object containing mentee profile information
   * */ 
  async createMenteeProfile(
    userId: string,
    dto: CreateMenteeProfileDto,
  ): Promise<AsyncReturn> {
    try {
      const user = await this.prisma.db.user.findUnique({ 
        where: { id: userId } 
      });

      if (!user || user.role !== UserRole.Mentee) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.UNAUTHORIZED,
          data: null,
        };
      }

      const menteeProfile = await this.prisma.db.menteeProfile.create({
        data: {
          bio: dto.bio,
          learningGoals: dto.learningGoals,
          areasOfInterest: dto.areasOfInterest,
          preferredSessionType: dto.preferredSessionType,
          availability: dto.availability,

          user: { connect: { id: userId } },
          updatedBy: { connect: { id: userId } },
        },
        include: { user: true, updatedBy: true },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.PROFILE_CREATED,
        data: menteeProfile,
      };
    } catch (error) {
      console.error('[Admin.createMenteeProfile]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * @description - Create a new mentor profile. Call this endpoint to create a new mentor profile upon successful creating user.
   * @userId - Id from the created user.
   * @dto - Data transfer object containing mentor profile information
   * @returns - Async return object containing mentor profile information
   * */ 
  async createMentorProfile(
    userId: string,
    dto: CreateMentorProfileDto,
  ): Promise<AsyncReturn> {
    try {
      const user = await this.prisma.db.user.findUnique({ 
        where: { id: userId } 
      });

      if (!user) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.USER_NOT_FOUND,
          data: null,
        };
      }

      if (user.role !== UserRole.Mentor) {
        return {
          status: AsyncStatus.Error,
          message: RETURN_MESSAGES.FAILURE.UNAUTHORIZED,
          data: null,
        };
      }

      const mentorProfile = await this.prisma.db.mentorProfile.create({
        data: {
          yearsOfExperience: dto.yearsOfExperience ?? null,
          linkedInUrl: dto.linkedInUrl ?? null,
          bio: dto.bio ?? null,
          skills: dto.skills,
          sessionRate: dto.sessionRate ?? null,
          availability: dto.availability,

          user: { connect: { id: userId } },
          updatedBy: { connect: { id: userId } },
        },
        include: { user: true, updatedBy: true },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.PROFILE_CREATED,
        data: mentorProfile,
      };
    } catch (error) {
      console.error('[Admin.createMentorProfile]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * @description - Update user status. Call this endpoint to update user status.
   * @adminId - Id of admin user making the request
   * @userId - Id of user to update status
   * @status - New status of user
   * @returns - Async return object containing user information
  */
  async updateUserStatus(
    adminId: string,
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<AsyncReturn> {
    try {
      const user = await this.prisma.db.user.update({
        where: { id: userId },
        data: {
          status: dto.status,
          updatedBy: {
            connect: { id: adminId },
          },
        },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.USER_STATUS_UPDATED,
        data: user,
      };
    } catch (error) {
      console.error('[Admin.updateUserStatus]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * @description - Update user role. Call this endpoint to update user role.
   * @adminId - Id of admin user making the request
   * @userId - Id of user to update role
   * @role - New role of user
   * @returns - Async return object containing user information
  */
  async updateUserRole(
    adminId: string,
    userId: string,
    dto: UpdateUserRoleDto,
  ): Promise<AsyncReturn> {
    try {
      const user = await this.prisma.db.user.update({
        where: { id: userId },
        data: {
          role: dto.role,
          updatedBy: {
            connect: { id: adminId },
          },
        },
      });

      return {
        status: AsyncStatus.Success,
        message: RETURN_MESSAGES.SUCCESS.USER_ROLE_UPDATED,
        data: user,
      };
    } catch (error) {
      console.error('[Admin.updateUserRole]', error);
      return {
        status: AsyncStatus.Error,
        message: RETURN_MESSAGES.FAILURE.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }
}
