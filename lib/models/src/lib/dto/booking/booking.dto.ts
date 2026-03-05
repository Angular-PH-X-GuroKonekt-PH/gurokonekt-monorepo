import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { BookingInterface, BookingStatus } from '../../interfaces/booking/booking.model';

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
