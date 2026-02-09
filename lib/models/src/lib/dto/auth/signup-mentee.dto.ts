import { API_RESPONSE, REGEX, RegisterMenteeRequest } from '@gurokonekt/models';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { CustomMatch } from '../decorators/custom-matches.decorator';

export class RegisterMenteeDto implements RegisterMenteeRequest {
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
} 