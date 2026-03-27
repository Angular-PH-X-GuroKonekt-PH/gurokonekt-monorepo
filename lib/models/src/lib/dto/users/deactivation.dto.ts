import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { DaysInWeek } from '../../interfaces/user/user.model';

export class SetSessionDurationDto {
  @ApiProperty({
    description: 'Standard session length in minutes. All bookable time slots will use this duration.',
    example: 60,
    minimum: 15,
  })
  @IsInt()
  @Min(15)
  sessionDurationMinutes!: number;
}

export class InitiateDeactivationDto {
  @ApiProperty({ description: 'Current account password for verification' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyDeactivationTokenDto {
  @ApiProperty({ description: 'Deactivation token from the email link' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class DeactivationFeedbackDto {
  @ApiProperty({ description: 'Token from deactivation email link (final validation)' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'Reason for deactivating the account' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class DowngradeMentorDto {
  @ApiProperty({
    description: 'Current account password — required to verify identity before downgrading the mentor account to mentee',
    example: 'CurrentPassword@123',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ManageAvailabilityDto {
  @ApiProperty({
    description: 'Standard session length in minutes. All bookable slots are derived from this duration. Minimum 15 minutes.',
    example: 60,
    minimum: 15,
  })
  @IsInt()
  @Min(15)
  sessionDurationMinutes!: number;

  @ApiProperty({
    description: 'Full weekly availability schedule. Replaces the existing schedule entirely. Each time frame defines a window; bookable slots are generated from it using sessionDurationMinutes.',
    type: 'array',
    example: [
      { day: DaysInWeek.Monday, timeFrames: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }] },
      { day: DaysInWeek.Wednesday, timeFrames: [{ from: '10:00', to: '13:00' }] },
    ],
  })
  availability!: { day: DaysInWeek; timeFrames: { from: string; to: string }[] }[];
}

export class AddAvailabilitySlotDto {
  @ApiProperty({
    enum: DaysInWeek,
    description: 'Day of the week to add availability frames to',
    example: DaysInWeek.Monday,
  })
  @IsEnum(DaysInWeek)
  day!: DaysInWeek;

  @ApiProperty({
    description: 'New time frames to append to this day. Must not overlap with existing frames for this day. Each frame must be at least sessionDurationMinutes long.',
    type: 'array',
    example: [{ from: '14:00', to: '17:00' }],
  })
  timeFrames!: { from: string; to: string }[];

  @ApiPropertyOptional({
    description: 'Optionally update the standard session duration (minutes) at the same time.',
    example: 60,
    minimum: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(15)
  sessionDurationMinutes?: number;
}

export class DeleteAvailabilitySlotDto {
  @ApiProperty({
    enum: DaysInWeek,
    description: 'Day of the week to delete from the availability schedule',
    example: DaysInWeek.Monday,
  })
  @IsEnum(DaysInWeek)
  day!: DaysInWeek;

  @ApiPropertyOptional({
    description: 'Index of the specific time frame to remove. If omitted, the entire day entry is removed.',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeFrameIndex?: number;
}
