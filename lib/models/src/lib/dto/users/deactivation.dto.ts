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
    description: 'Array of day-availability entries to set as the full schedule',
    example: [
      { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }] },
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
    description: 'Time frames for this day (24h format). Replaces all existing slots for the day.',
    example: [{ from: '09:00', to: '12:00' }, { from: '14:00', to: '17:00' }],
  })
  timeFrames!: { from: string; to: string }[];
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
