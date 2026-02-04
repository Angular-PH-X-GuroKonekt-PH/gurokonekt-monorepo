import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterMentorDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  lastName: string;

  @ApiProperty({ required: false, example: 'Jr.' })
  @IsOptional()
  @IsString()
  suffix?: string;

  @ApiProperty({
    example: 'alice@example.com',
    description: 'Unique email address used for login',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Minimum 8 characters, must include uppercase, lowercase, number, and symbol',
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Must match the password field',
  })
  @IsString()
  confirmPassword: string;

  @ApiProperty({
    example: 'Philippines',
    description: 'Country of residence',
  })
  @IsString()
  country: string;

  @ApiProperty({
    example: 'English',
    required: false,
    description: 'Primary language spoken',
  })
  @IsString()
  language: string;

  @ApiProperty({
    example: 'Asia/Manila',
    description: 'IANA timezone identifier (e.g., "Asia/Manila", "America/New_York"). Used for scheduling and time-based features.'
  })
  @IsString()
  timezone: string;

  @ApiProperty({
    example: '+639123456789',
    description: 'Mobile number in E.164 international format. Must start with "+" followed by country code and subscriber number (no spaces or dashes).'
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: 5,
    required: false,
    description: 'Total years of professional experience',
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  yearsOfExperience: number;

  @ApiProperty({
    example: 'https://linkedin.com/in/johnsmith',
    required: false,
    description: 'LinkedIn profile URL',
  })
  @IsString()
  @IsOptional()
  linkedInUrl?: string;

  @ApiProperty({
    example: '["Web Development", "Project Management"]',
    required: false,
    description: 'Areas of expertise as a JSON array of strings',
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  @IsArray()
  areasOfExpertise: string[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
    required: false,
    description: 'Supporting documents (PDF, images, etc.)',
  })
  files: any[];
}
