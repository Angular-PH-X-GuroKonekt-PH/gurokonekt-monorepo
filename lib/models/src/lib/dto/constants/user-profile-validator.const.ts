import { instanceToPlain } from "class-transformer";
import { UserRole } from "../../interfaces/user/user.model";
import { UpdateMenteeProfileDto, UpdateMentorProfileDto } from "../users/update-user-profile.dto";

export class UserProfileValidator {
  static getRequiredFields(role: UserRole): string[] {
    if (role === UserRole.Mentor) {
      return ['bio', 'skills', 'availability', 'updatedById'];
    }
    return ['bio', 'learningGoals', 'areasOfInterest', 'preferredSessionType', 'updatedById'];
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

  static buildProfilePayload(dto: UpdateMenteeProfileDto | UpdateMentorProfileDto, role: UserRole) {
    if (role === UserRole.Mentor) {
      const currentDto = dto as UpdateMentorProfileDto;
      const yearsOfExperience =
        currentDto.yearsOfExperience === undefined || currentDto.yearsOfExperience === null
          ? undefined
          : Number(currentDto.yearsOfExperience);

      const payload: Record<string, unknown> = {
        bio: currentDto.bio,
        areasOfExpertise: currentDto.areasOfExpertise,
        skills: currentDto.skills,
        updatedById: currentDto.updatedById,
      };

      if (yearsOfExperience !== undefined && Number.isFinite(yearsOfExperience)) {
        payload['yearsOfExperience'] = yearsOfExperience;
      }

      if (currentDto.linkedInUrl !== undefined) {
        payload['linkedInUrl'] = currentDto.linkedInUrl;
      }

      if (currentDto.sessionRate !== undefined) {
        payload['sessionRate'] = currentDto.sessionRate;
      }

      // Only touch availability when the client explicitly sends it.
      // Omitting it prevents profile settings updates from wiping the schedule.
      if (currentDto.availability !== undefined) {
        payload['availability'] = instanceToPlain(currentDto.availability);
      }

      return payload;
    } else {
      const currentDto = dto as UpdateMenteeProfileDto;
      return {
        bio: currentDto.bio,
        learningGoals: currentDto.learningGoals,
        areasOfInterest: currentDto.areasOfInterest,
        preferredSessionType: currentDto.preferredSessionType,
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