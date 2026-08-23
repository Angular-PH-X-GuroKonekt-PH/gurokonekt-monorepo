import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import {
  BroadcastAnnouncementDto,
  ListAnnouncementsQueryDto,
  ResponseStatus,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AdminAnnouncementsService } from './admin-announcements.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(
    private readonly announcementsService: AdminAnnouncementsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get sent announcement summaries for the admin portal',
  })
  @ApiResponse({
    status: 200,
    description: 'Announcements retrieved successfully.',
  })
  async findAll(@Query() query: ListAnnouncementsQueryDto) {
    const response =
      await this.announcementsService.findAllAnnouncements(query);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Post('broadcast')
  @ApiOperation({
    summary:
      'Broadcast an announcement to all active users (or a specific role)',
  })
  async broadcast(@Body() dto: BroadcastAnnouncementDto) {
    const response = await this.announcementsService.broadcastAnnouncement(dto);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        {
          status: response.status,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
        },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }
}
