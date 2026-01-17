import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber, IsUrl } from 'class-validator';

export class UpdateMentorProfileDto {
  @ApiPropertyOptional({ description: 'First name of the mentor' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Middle name of the mentor' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ description: 'Last name of the mentor' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Suffix of the mentor, e.g., Jr., Sr., III' })
  @IsOptional()
  @IsString()
  suffix?: string;

  @ApiPropertyOptional({ description: 'Country of the mentor' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Preferred language of the mentor' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Years of experience the mentor has' })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL' })
  @IsOptional()
  @IsUrl()
  linkedInUrl?: string;

  @ApiPropertyOptional({ description: 'Biography of the mentor' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Skills of the mentor',
    type: [String],
    example: ['TypeScript', 'NestJS', 'Prisma'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Hourly/session rate' })
  @IsOptional()
  @IsNumber()
  sessionRate?: number;

  @ApiPropertyOptional({
    description: 'Availability schedule of the mentor',
    type: [String],
    example: ['Monday 9-11AM', 'Wednesday 2-4PM'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availability?: string[];
}
