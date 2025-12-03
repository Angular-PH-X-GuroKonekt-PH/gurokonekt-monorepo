import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListUsersDto {
  @ApiProperty({
    description: 'Number of users to return',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Number of users to skip',
    example: 0,
    required: false,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @ApiProperty({
    description: 'Search term for firstName, lastName, or email',
    example: 'john',
    required: false
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Include archived users',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  includeArchived?: boolean = false;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    required: false
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    example: 'DESC',
    required: false,
    enum: ['ASC', 'DESC']
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}