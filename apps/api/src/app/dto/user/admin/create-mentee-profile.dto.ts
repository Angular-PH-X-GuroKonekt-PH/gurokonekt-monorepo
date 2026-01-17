import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { MenteePreferredSessionType } from '@prisma/client';

export class CreateMenteeProfileDto {
  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty()
  @IsString()
  bio: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  learningGoals: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  areasOfInterest: string[];

  @ApiProperty({ enum: MenteePreferredSessionType })
  @IsEnum(MenteePreferredSessionType)
  preferredSessionType: MenteePreferredSessionType;

  @ApiProperty({ type: [String] })
  @IsArray()
  availability: string[];
}
