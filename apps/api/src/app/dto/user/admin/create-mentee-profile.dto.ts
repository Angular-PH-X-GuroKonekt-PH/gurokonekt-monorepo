import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { MenteePreferredSessionType } from '@gurokonekt/models';

export class CreateMenteeProfileDto {
  @ApiProperty({
    example: 'Philippines',
    description: 'Country of residence',
  })
  @IsString()
  country: string;

  @ApiProperty({
    example: 'English',
    required: false,
    description: 'Primary language spoken by the mentee',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    example: 'I want to improve my backend development skills.',
    description: 'Short bio or personal description',
  })
  @IsString()
  bio: string;

  @ApiProperty({
    example: ['Backend Development', 'System Design'],
    description: 'List of learning goals',
    type: [String],
  })
  @IsArray()
  learningGoals: string[];

  @ApiProperty({
    example: ['NestJS', 'Databases', 'Cloud'],
    description: 'Areas of interest',
    type: [String],
  })
  @IsArray()
  areasOfInterest: string[];

  @ApiProperty({ enum: MenteePreferredSessionType })
  @IsEnum(MenteePreferredSessionType)
  preferredSessionType: MenteePreferredSessionType;

  @ApiProperty({
    example: ['Weekends', 'Evenings'],
    description: 'Available schedule for mentoring sessions',
    type: [String],
  })
  @IsArray()
  availability: string[];
}
