import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  ResponseDto,
  UpdateNotificationDto,
} from '@gurokonekt/models';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ====================================================
  // POST - Create Notification
  // ====================================================

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully', type: ResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  // ====================================================
  // GET - Get Notifications for Authenticated User (from JWT)
  // NOTE: declared before :id to prevent route conflict
  // ====================================================

  @Get('me')
  @ApiOperation({ summary: 'Get all notifications for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully', type: ResponseDto })
  async findMyNotifications(@Req() req: Request & { user: { id: string } }) {
    return this.notificationService.findMyNotifications(req.user.id);
  }

  // ====================================================
  // GET - Get All Notifications (admin / internal)
  // ====================================================

  @Get()
  @ApiOperation({ summary: 'Get all notifications (admin / internal use)' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully', type: ResponseDto })
  async findAll() {
    return this.notificationService.findAll();
  }

  // ====================================================
  // GET - Get Notifications by User ID
  // NOTE: must be declared before :id to avoid route conflicts
  // ====================================================

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all notifications for a specific user' })
  @ApiParam({ name: 'userId', type: String, description: 'UUID of the user', example: 'uuid-user-id' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findByUserId(
    @Param('userId') userId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationService.findByUserId(userId, req.user.id);
  }

  // ====================================================
  // GET - Get Notification by ID
  // ====================================================

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by ID' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the notification', example: 'uuid-notification-id' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
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
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the notification', example: 'uuid-notification-id' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  // ====================================================
  // PATCH - Update Notification
  // ====================================================

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification (status or message)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the notification', example: 'uuid-notification-id' })
  @ApiResponse({ status: 200, description: 'Notification updated successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
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
  @ApiOperation({ summary: 'Soft-delete a notification (sets status to DELETED)' })
  @ApiParam({ name: 'id', type: String, description: 'UUID of the notification', example: 'uuid-notification-id' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully', type: ResponseDto })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async softDelete(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationService.softDelete(id, req.user.id);
  }
}
