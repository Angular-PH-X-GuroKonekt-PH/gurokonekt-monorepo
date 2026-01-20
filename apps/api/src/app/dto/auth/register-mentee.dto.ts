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
  @IsOptional()
  @IsString()
  language?: string;
} 