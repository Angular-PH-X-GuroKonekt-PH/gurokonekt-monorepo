import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { MenteePreferredSessionType } from '@gurokonekt/models';

export class UpdateMenteeProfileDto {
  @ApiPropertyOptional({ description: 'First name of the mentee' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Middle name of the mentee' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ description: 'Last name of the mentee' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Suffix of the mentee, e.g., Jr., Sr., III' })
  @IsOptional()
  @IsString()
  suffix?: string;

  @ApiPropertyOptional({ description: 'Country of the mentee' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Preferred language of the mentee' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Short biography of the mentee' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Learning goals of the mentee',
    type: [String],
    example: ['Improve communication', 'Learn TypeScript']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningGoals?: string[];

  @ApiPropertyOptional({
    description: 'Areas of interest of the mentee',
    type: [String],
    example: ['Web Development', 'UI/UX Design']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasOfInterest?: string[];

  @ApiPropertyOptional({
    description: 'Preferred session type for the mentee',
    enum: MenteePreferredSessionType,
    example: MenteePreferredSessionType.Online
  })
  @IsOptional()
  @IsEnum(MenteePreferredSessionType)
  preferredSessionType?: MenteePreferredSessionType;

  @ApiPropertyOptional({
    description: 'Availability schedule of the mentee',
    type: [String],
    example: ['Monday 9-11AM', 'Wednesday 2-4PM']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availability?: string[];
}
