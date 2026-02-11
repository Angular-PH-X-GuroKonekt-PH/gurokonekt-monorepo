import { MenteePreferredSessionType, MenteeProfileUpdateInterface, UserAvailabilityInterface } from "@gurokonekt/models/interfaces/user/user.model";
import { 
  IsString, 
  IsArray, 
  ArrayNotEmpty, 
  IsEnum, 
  IsUUID 
} from 'class-validator';

export class MenteeProfileDto implements MenteeProfileUpdateInterface { 
  @IsString()
  bio: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  learningGoals: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  areasOfInterest: string[];

  @IsEnum(MenteePreferredSessionType)
  preferredSessionType: MenteePreferredSessionType;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  availability: UserAvailabilityInterface[];

  @IsUUID()
  updatedById: string;
}