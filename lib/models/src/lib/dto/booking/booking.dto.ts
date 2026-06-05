import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, Max, Min } from 'class-validator';
import { BookingInterface, BookingStatus } from '../../interfaces/booking/booking.model';

export class MentorBookingsQueryDto {
  @ApiPropertyOptional({ enum: BookingStatus, description: 'Filter bookings by status' })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UserBookingsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdminListBookingsQueryDto {
  @ApiPropertyOptional({ enum: BookingStatus, description: 'Filter by booking status' })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter sessions from this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter sessions up to this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search by mentor or mentee name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['sessionDateTime', 'createdAt'], description: 'Sort field' })
  @IsOptional()
  @IsEnum(['sessionDateTime', 'createdAt'])
  sortBy?: 'sessionDateTime' | 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Sort direction' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

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

export class AdminForceCancelBookingDto {
  @ApiProperty({ description: 'Reason for force-cancelling the booking' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}

export class ApproveBookingDto {
  @ApiProperty({
    description: 'Video call or meeting link for the confirmed session',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  @IsUrl()
  @IsNotEmpty()
  sessionLink!: string;
}

export class CreateBookingDto implements Partial<BookingInterface> {
  @ApiProperty({
    description: 'UUID of the mentor to book a session with',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
  })
  @IsUUID()
  @IsNotEmpty()
  mentorId!: string;

  @ApiProperty({
    description: 'Requested session date and time (ISO 8601)',
    example: '2026-03-15T10:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  sessionDateTime!: Date;

  @ApiPropertyOptional({
    description: 'Optional notes or message to the mentor',
    example: 'I would like to discuss career transitions into backend engineering.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBookingDto implements Partial<BookingInterface> {
  @ApiPropertyOptional({
    description: 'Updated session date and time (ISO 8601)',
    example: '2026-03-20T14:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  sessionDateTime?: Date;

  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'New booking status',
    example: BookingStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Session link (e.g. video call URL), required when approving',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  @IsOptional()
  @IsUrl()
  sessionLink?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or updates',
    example: 'Session moved online — link attached.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
