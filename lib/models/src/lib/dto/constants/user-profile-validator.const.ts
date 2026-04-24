import { instanceToPlain } from "class-transformer";
import { UserRole } from "../../interfaces/user/user.model";
import { UpdateMenteeProfileDto, UpdateMentorProfileDto } from "../users/update-user-profile.dto";

export class UserProfileValidator {
  static getRequiredFields(role: UserRole): string[] {
    if (role === UserRole.Mentor) {
      return ['bio', 'skills', 'availability', 'updatedById'];
    }
    return ['bio', 'learningGoals', 'areasOfInterest', 'preferredSessionType', 'availability', 'updatedById'];
  }

  static validateRequiredFields(dto: UpdateMentorProfileDto | UpdateMenteeProfileDto, role: UserRole): string[] {
    const requiredFields = this.getRequiredFields(role);
    return requiredFields.filter(field => {
      const value = (dto as any)[field];
      if (Array.isArray(value)) return value.length === 0;
      return value === undefined || value === null || value === '';
    });
  }

  static throwIfMissingFields(dto: UpdateMentorProfileDto | UpdateMenteeProfileDto, role: UserRole) {
    const missingFields = this.validateRequiredFields(dto, role);
    if (missingFields.length > 0) {
      const message = `Missing required fields: ${missingFields.join(', ')}`;
      throw new Error(message);
    }
  }

  static buildProfilePayload(dto: UpdateMenteeProfileDto | UpdateMentorProfileDto, role: UserRole, isProfileComplete: boolean) {
    if (role === UserRole.Mentor) {
      const currentDto = dto as UpdateMentorProfileDto;
      return {
        bio: currentDto.bio,
        skills: currentDto.skills,
        sessionRate: currentDto.sessionRate,
        availability: instanceToPlain(currentDto.availability),
        updatedById: currentDto.updatedById,
        ...(isProfileComplete && {
          areasOfExpertise: currentDto.areasOfExpertise,
          yearsOfExperience: currentDto.yearsOfExperience,
        }),
      };
    } else {
      const currentDto = dto as UpdateMenteeProfileDto;
      return {
        bio: currentDto.bio,
        learningGoals: currentDto.learningGoals,
        areasOfInterest: currentDto.areasOfInterest,
        preferredSessionType: currentDto.preferredSessionType,
        availability: instanceToPlain(currentDto.availability),
        updatedById: currentDto.updatedById,
      };
    }
  }

  static buildUserUpdateData(dto: any, isProfileComplete: boolean, role: UserRole) {
    return !isProfileComplete
      ? {
          ...(role === UserRole.Mentor
            ? { isMentorProfileComplete: true }
            : { isProfileComplete: true }),
          updatedById: dto.updatedById,
        }
      : {
          phoneNumber: dto.phoneNumber,
          country: dto.country,
          language: dto.language,
          timezone: dto.timezone,
          updatedById: dto.updatedById,
        };
  }
}