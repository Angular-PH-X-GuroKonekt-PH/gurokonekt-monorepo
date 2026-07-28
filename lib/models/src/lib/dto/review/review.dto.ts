import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'UUID of the completed booking being reviewed',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @IsUUID()
  @IsNotEmpty()
  bookingId!: string;

  @ApiProperty({ description: 'Rating from 1 to 5', example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({
    description: 'Optional written review, up to 1000 characters',
    example: 'Very insightful session — clear, practical advice.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class GetReviewsQueryDto {
  @ApiPropertyOptional({
    description: 'Return the review for this booking. Mutually exclusive with mentorId.',
    example: 'c9d0e1f2-a3b4-5678-cdef-012345678901',
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Return all reviews for this mentor. Mutually exclusive with bookingId.',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
  })
  @IsOptional()
  @IsUUID()
  mentorId?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page (max 100)', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
