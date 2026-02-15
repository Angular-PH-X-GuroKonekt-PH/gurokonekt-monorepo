import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { API_RESPONSE, REGEX, RegisterMentorRequest } from '@gurokonekt/models';
import { CustomMatch } from '../decorators/custom-matches.decorator';

export class RegisterMentorDto implements RegisterMentorRequest {
  @ApiProperty({ 
    required: true,
    example: 'John',
  })
  @IsString()
  firstName!: string;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  lastName!: string;

  @ApiProperty({ required: false, example: 'Jr.' })
  @IsOptional()
  @IsString()
  suffix?: string;

  @ApiProperty({
    example: 'alice@example.com',
    description: 'Unique email address used for login',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Minimum 8 characters, must include uppercase, lowercase, number, and symbol',
  })
  @IsString()
  @Matches(
    REGEX.PASSWORD, 
    { message: API_RESPONSE.ERROR.PASSWORD_REGEX_MISMATCH.message }
  )
  password!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Must match the password field',
  })
  @IsString()
  @CustomMatch(
    'password', 
    { message: API_RESPONSE.ERROR.PASSWORD_MISMATCH.message }
  )
  confirmPassword!: string;

  @ApiProperty({
    example: 'Philippines',
    description: 'Country of residence',
  })
  @IsString()
  country!: string;

  @ApiProperty({
    example: 'English',
    description: 'Primary language spoken',
  })
  @IsString()
  language!: string;

  @ApiProperty({
    example: 'Asia/Manila',
    description: 'IANA timezone identifier (e.g., "Asia/Manila", "America/New_York"). Used for scheduling and time-based features.'
  })
  @IsString()
  timezone!: string;

  @ApiProperty({
    example: '+639123456789',
    description: 'Mobile number in E.164 international format. Must start with "+" followed by country code and subscriber number (no spaces or dashes).'
  })
  @IsString()
  @Matches(
    REGEX.PHONE, 
    { message: API_RESPONSE.ERROR.INVALID_PHONE_FORMAT.message }
  )
  phoneNumber!: string;

  @ApiProperty({
    example: 5,
    description: 'Total years of professional experience',
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  yearsOfExperience!: number;

  @ApiProperty({
    example: 'https://linkedin.com/in/johnsmith',
    required: false,
    description: 'LinkedIn profile URL',
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: API_RESPONSE.ERROR.INVALID_URL.message })
  linkedInUrl?: string;

  @ApiProperty({
    example: '["Web Development", "Project Management"]',
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
  areasOfExpertise!: string[];
  
  @ApiProperty({
    example: 'Resume and portfolio files',
    description: 'Array of files uploaded by the mentor (e.g., resume, portfolio). Each file should include necessary metadata such as filename, file type, and file size.',
  })
    files!: any[];
}
