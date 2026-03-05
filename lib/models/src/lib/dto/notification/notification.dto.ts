import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  NotificationInterface,
  NotificationStatus,
  NotificationType,
} from '../../interfaces/notification/notification.model';

export class CreateNotificationDto implements Partial<NotificationInterface> {
  @ApiProperty({
    description: 'UUID of the user to notify',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Short title for the notification',
    example: 'Booking Approved',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Full notification message body',
    example: 'Your booking request has been approved by the mentor.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Category of the notification',
    example: NotificationType.BOOKING,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @ApiPropertyOptional({
    description: 'Optional reference ID (e.g. bookingId, sessionId)',
    example: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
  })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class UpdateNotificationDto implements Partial<NotificationInterface> {
  @ApiPropertyOptional({
    enum: NotificationStatus,
    description: 'New status for the notification',
    example: NotificationStatus.READ,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Updated message body',
    example: 'Updated notification message.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
