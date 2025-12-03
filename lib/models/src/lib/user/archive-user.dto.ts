import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ArchiveUserDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Whether the user is archived',
    example: true
  })
  @IsBoolean()
  @IsNotEmpty()
  isArchived: boolean;

  @ApiProperty({
    description: 'Archived timestamp',
    example: '2025-12-03T10:00:00Z',
    required: false
  })
  @IsDate()
  @IsOptional()
  archivedAt?: Date;
}