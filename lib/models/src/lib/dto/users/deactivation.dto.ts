import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { DaysInWeek } from '../../interfaces/user/user.model';

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

export class DowngradeMentorDto {
  @ApiProperty({
    description: 'Current account password for verification before downgrading',
    example: 'CurrentPassword@123',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ManageAvailabilityDto {
  @ApiProperty({
    description: 'Standard session length in minutes. Each time frame must be at least this long. Minimum 15.',
    example: 60,
    minimum: 15,
  })
  @IsInt()
  @Min(15)
  sessionDurationMinutes!: number;

  @ApiProperty({
    description: 'Full weekly availability schedule. Replaces existing schedule entirely.',
    example: [
      { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }] },
      { day: 'wednesday', timeFrames: [{ from: '10:00', to: '13:00' }] },
    ],
  })
  availability!: { day: DaysInWeek; timeFrames: { from: string; to: string }[] }[];
}

export class AddAvailabilitySlotDto {
  @ApiProperty({
    enum: DaysInWeek,
    description: 'Day of the week for this availability slot',
    example: DaysInWeek.Monday,
  })
  @IsEnum(DaysInWeek)
  day!: DaysInWeek;

  @ApiProperty({
    description: 'New time frames to append to this day. Must not overlap with existing frames for this day.',
    example: [{ from: '14:00', to: '17:00' }],
  })
  timeFrames!: { from: string; to: string }[];

  @ApiPropertyOptional({
    description: 'Optionally update the standard session duration (minutes) at the same time. Minimum 15.',
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
    description: 'Day of the week from which to delete the slot',
    example: DaysInWeek.Monday,
  })
  @IsEnum(DaysInWeek)
  day!: DaysInWeek;

  @ApiPropertyOptional({
    description: 'Zero-based index of the specific time frame to delete. If omitted, all slots for the day are removed.',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeFrameIndex?: number;
}
