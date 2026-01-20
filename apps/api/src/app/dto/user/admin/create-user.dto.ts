import { ApiProperty } from '@nestjs/swagger';
import { UserRole as PrismaUserRole, UserStatus as PrismaUserStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
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

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: PrismaUserRole })
  @IsEnum(PrismaUserRole)
  role: PrismaUserRole;

  @ApiProperty({ enum: PrismaUserStatus })
  @IsEnum(PrismaUserStatus)
  status: PrismaUserStatus;
}
