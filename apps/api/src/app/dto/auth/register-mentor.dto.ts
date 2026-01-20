import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    example: 5,
    required: false,
    description: 'Total years of professional experience',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsOfExperience?: number;

  @ApiProperty({
    example: 'https://linkedin.com/in/johnsmith',
    required: false,
    description: 'LinkedIn profile URL',
  })
  @IsOptional()
  @IsString()
  linkedInUrl?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
    required: false,
    description: 'Supporting documents (PDF, images, etc.)',
  })
  files?: any[];
}
