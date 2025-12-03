import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John'
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User middle name',
    example: 'Michael',
    required: false
  })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe'
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User extension name (e.g., Jr., Sr., III)',
    example: 'Jr.',
    required: false
  })
  @IsString()
  @IsOptional()
  extensionName?: string;

  @ApiProperty({
    description: 'User country or timezone',
    example: 'UTC'
  })
  @IsString()
  @IsNotEmpty()
  countryOrTimezone: string;

  @ApiProperty({
    description: 'User preferred language',
    example: 'en',
    required: false
  })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @ApiProperty({
    description: 'Whether the user has accepted terms',
    example: true
  })
  @IsBoolean()
  @IsNotEmpty()
  acceptedTerms: boolean;

  @ApiProperty({
    description: 'Hashed user password',
    example: '$2b$10$abcdefghijklmnopqrstuvwx',
    required: false
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  passwordHash?: string;

  @ApiProperty({
    description: 'Whether the user email is verified',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({
    description: 'User profile type',
    example: 'mentee',
    required: false,
    enum: ['mentee', 'mentor']
  })
  @IsString()
  @IsOptional()
  @IsEnum(['mentee', 'mentor'])
  profileType?: 'mentee' | 'mentor';
}