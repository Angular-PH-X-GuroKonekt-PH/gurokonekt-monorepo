import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterMenteeDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  suffix?: string;
  
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;

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
} 