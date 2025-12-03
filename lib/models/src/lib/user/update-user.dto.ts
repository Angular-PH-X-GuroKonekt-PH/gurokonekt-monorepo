import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2025-12-03T10:00:00Z',
    required: false
  })
  @IsDate()
  @IsOptional()
  updatedAt?: Date;

  @ApiProperty({
    description: 'Whether the user is archived',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiProperty({
    description: 'Archived timestamp',
    example: '2025-12-03T10:00:00Z',
    required: false
  })
  @IsDate()
  @IsOptional()
  archivedAt?: Date;
}