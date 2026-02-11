import { DaysInWeek, MenteePreferredSessionType, UpdateMenteeProfileInterface, TimeFrameInterface, UserAvailabilityInterface, UpdateMentorProfileInterface } from "@gurokonekt/models/interfaces/user/user.model";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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

export class TimeFrameDto implements TimeFrameInterface {
  @ApiProperty({
    description: 'Start time (24h format)',
    example: '07:00'
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'End time (24h format)',
    example: '09:00'
  })
  @IsString()
  to: string;
}

export class UserAvailabilityDto implements UserAvailabilityInterface{
  @ApiProperty({
    description: 'Day of the week',
    enum: DaysInWeek,
    example: DaysInWeek.Monday
  })
  @IsEnum(DaysInWeek)
  day: DaysInWeek;

  @ApiProperty({
    description: 'List of available time frames for the day',
    type: [TimeFrameDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeFrameDto)
  timeFrames: TimeFrameDto[];
}

export class UpdateMenteeProfileDto implements UpdateMenteeProfileInterface { 
  @ApiProperty({
    description: 'Short biography of the mentee',
    example: 'Aspiring frontend developer passionate about Angular and UX.'
  })
  @IsString()
  bio: string;

  @ApiProperty({
    description: 'List of learning goals the mentee wants to achieve',
    example: ['System Design', 'Clean Architecture', 'Angular Best Practices'],
    type: [String]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  learningGoals: string[];

  @ApiProperty({
    description: 'Areas of interest of the mentee',
    example: ['Web Development', 'Cloud Computing'],
    type: [String]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  areasOfInterest: string[];

  @ApiProperty({
    description: 'Preferred type of session',
    enum: MenteePreferredSessionType,
    example: MenteePreferredSessionType.Online
  })
  @IsEnum(MenteePreferredSessionType)
  preferredSessionType: MenteePreferredSessionType;

  @ApiProperty({
    description: 'User availability schedule grouped by day with multiple time frames',
    type: [UserAvailabilityDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAvailabilityDto)
  availability: UserAvailabilityDto[];

  @ApiProperty({
    description: 'UUID of the user performing the update',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21'
  })
  @IsUUID()
  updatedById: string;
}

export class UpdateMentorProfileDto implements UpdateMentorProfileInterface {
  @ApiProperty({
    description: 'Short biography of the mentor',
    example: 'Senior backend engineer with 10 years experience in NodeJS.'
  })
  @IsString()
  bio: string;

  @ApiProperty({
    description: 'List of mentor skills',
    example: ['NodeJS', 'Prisma', 'System Design'],
    type: [String]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  skills: string[];

  @ApiPropertyOptional({
    description: 'Session rate per hour',
    example: 1500
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sessionRate?: number;

  @ApiProperty({
    description: 'User availability schedule grouped by day with multiple time frames',
    type: [UserAvailabilityDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserAvailabilityDto)
  availability: UserAvailabilityDto[];

  @ApiProperty({
    description: 'UUID of the user performing the update',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21'
  })
  @IsUUID()
  updatedById: string;
}
