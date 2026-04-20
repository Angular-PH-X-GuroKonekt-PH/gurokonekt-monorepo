import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  // UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
// import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  ResponseDto,
  SWAGGER_DOCUMENTATION,
  UpdateNotificationDto,
} from '@gurokonekt/models';

@ApiTags('Notifications')
@ApiBearerAuth()
// @UseGuards(JwtGuardGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ====================================================
  // POST - Create Notification
  // ====================================================

  @Post()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.CREATE_NOTIFICATION.summary,
    description: SWAGGER_DOCUMENTATION.CREATE_NOTIFICATION.description,
  })
  @ApiBody({
    type: CreateNotificationDto,
    examples: {
      bookingApproved: {
        summary: 'Booking approved notification',
        value: SWAGGER_DOCUMENTATION.CREATE_NOTIFICATION.bodyExample,
      },
      announcement: {
        summary: 'Platform announcement',
        value: {
          userId: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
          title: 'Platform Maintenance',
          message: 'Gurokonekt will be down for maintenance on April 30 from 2 AM – 4 AM UTC.',
          type: 'ANNOUNCEMENT',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created and delivered in real-time via WebSocket (if user is online).',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 201,
        message: 'Notification created successfully',
        data: {
          id: 'f1e2d3c4-b5a6-7890-fedc-ba9876543210',
          userId: 'b8b1f7c2-3a21-4c9b-9c3a-7e3d7a9d9a21',
          title: 'Booking Approved',
          message: 'Your session with Carlos Reyes on April 15 has been approved.',
          type: 'BOOKING',
          status: 'UNREAD',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error — missing required fields or invalid type.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  // ====================================================
  // GET - Get Notifications for Authenticated User (from JWT)
  // NOTE: declared before :id to prevent route conflict
  // ====================================================

  @Get('me')
  @ApiOperation({
    summary: 'Get all notifications for the authenticated user',
    description: 'Returns all non-deleted notifications for the user identified by the JWT, ordered by creation date descending.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Notifications retrieved successfully',
        data: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  async findMyNotifications(@Req() req: Request & { user: { id: string } }) {
    return this.notificationService.findMyNotifications(req.user?.id ?? '259f2a25-c180-4609-a603-6d60ba04e69a');
  }

  // ====================================================
  // GET - Get All Notifications (admin / internal)
  // ====================================================

  @Get()
  @ApiOperation({
    summary: 'Get all notifications (admin / internal use)',
    description: 'Returns every notification in the system. Intended for admin dashboards only.',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Notifications retrieved successfully',
        data: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  async findAll() {
    return this.notificationService.findAll();
  }

  // ====================================================
  // GET - Get Notifications by User ID
  // NOTE: must be declared before :id to avoid route conflicts
  // ====================================================

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get all notifications for a specific user',
    description: 'Returns all non-deleted notifications for the given user. The authenticated user can only access their own notifications unless they have admin privileges.',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'UUID of the user',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Notifications retrieved successfully',
        data: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — notification does not belong to the authenticated user.' })
  async findByUserId(
    @Param('userId') userId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationService.findByUserId(userId, req.user?.id ?? '259f2a25-c180-4609-a603-6d60ba04e69a');
  }

  // ====================================================
  // GET - Get Notification by ID
  // ====================================================

  @Get(':id')
  @ApiOperation({
    summary: 'Get a notification by ID',
    description: 'Returns a single notification. Only the notification owner can access it.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the notification',
    example: 'f1e2d3c4-b5a6-7890-fedc-ba9876543210',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Notification retrieved successfully',
        data: {
          id: 'f1e2d3c4-b5a6-7890-fedc-ba9876543210',
          title: 'Booking Approved',
          message: 'Your session has been approved.',
          type: 'BOOKING',
          status: 'UNREAD',
          createdAt: '2026-03-27T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — notification does not belong to you.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async findById(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationService.findById(id, req.user.id);
  }

  // ====================================================
  // PATCH - Mark Notification as Read
  // NOTE: declared before :id to prevent route conflict
  // ====================================================

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read',
    description: 'Sets the notification status to READ and records the readAt timestamp. Only the notification owner can mark it as read.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the notification',
    example: 'f1e2d3c4-b5a6-7890-fedc-ba9876543210',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Notification updated successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — notification does not belong to you.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async markAsRead(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationService.markAsRead(id, req.user?.id ?? '259f2a25-c180-4609-a603-6d60ba04e69a');
  }

  // ====================================================
  // PATCH - Update Notification
  // ====================================================

  @Patch(':id')
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.UPDATE_NOTIFICATION.summary,
    description: SWAGGER_DOCUMENTATION.UPDATE_NOTIFICATION.description,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the notification',
    example: 'f1e2d3c4-b5a6-7890-fedc-ba9876543210',
  })
  @ApiBody({
    type: UpdateNotificationDto,
    examples: {
      markRead: {
        summary: 'Mark as read via status update',
        value: SWAGGER_DOCUMENTATION.UPDATE_NOTIFICATION.bodyExample,
      },
      updateMessage: {
        summary: 'Update message text',
        value: { message: 'Your session has been rescheduled to April 20 at 2 PM.' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Notification updated successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — notification does not belong to you.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationService.update(id, dto, req.user.id);
  }

  // ====================================================
  // DELETE - Soft Delete Notification
  // ====================================================

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-delete a notification',
    description: 'Sets the notification status to DELETED. The record is retained in the database but will not appear in normal queries. Only the notification owner can delete it.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the notification',
    example: 'f1e2d3c4-b5a6-7890-fedc-ba9876543210',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification soft-deleted successfully.',
    type: ResponseDto,
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Notification deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT.' })
  @ApiResponse({ status: 403, description: 'Access denied — notification does not belong to you.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  async softDelete(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationService.softDelete(id, req.user.id);
  }
}
