import { DaysInWeek, MenteePreferredSessionType, UpdateMenteeProfileInterface, TimeFrameInterface, UserAvailabilityInterface, UpdateMentorProfileInterface } from "@gurokonekt/models/interfaces/user/user.model";
import { Type } from "class-transformer";
import { 
  IsString, 
  IsArray, 
  ArrayNotEmpty, 
  IsEnum, 
  IsUUID, 
  ValidateNested,
  IsNumber,
  Min,
  IsOptional
} from 'class-validator';

export class UpdateMenteeProfileDto implements UpdateMenteeProfileInterface { 
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
  @ValidateNested({ each: true })
  @Type(() => UserAvailabilityDto)
  availability: UserAvailabilityDto[];

  @IsUUID()
  updatedById: string;
}

export class UpdateMentorProfileDto implements UpdateMentorProfileInterface {
  @IsString()
  bio: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  skills: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  sessionRate?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAvailabilityDto)
  availability: UserAvailabilityInterface[];

  @IsUUID()
  updatedById: string;
}

export class UserAvailabilityDto implements UserAvailabilityInterface{
  @IsEnum(DaysInWeek)
  day: DaysInWeek;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeFrameDto)
  timeFrames: TimeFrameDto[];
}

export class TimeFrameDto implements TimeFrameInterface {
  @IsString()
  from: string;

  @IsString()
  to: string;
}