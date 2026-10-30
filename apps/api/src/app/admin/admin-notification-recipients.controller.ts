import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Ip,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddNotificationRecipientDto, ResponseDto, ResponseStatus } from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AdminNotificationRecipientsService } from './admin-notification-recipients.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/notification-recipients')
export class AdminNotificationRecipientsController {
  constructor(private readonly recipientsService: AdminNotificationRecipientsService) {}

  @Get()
  @ApiOperation({ summary: 'List the emails that receive admin alerts (e.g. new mentor registrations)' })
  async getRecipients() {
    return this.unwrap(await this.recipientsService.getRecipients());
  }

  @Post()
  @ApiOperation({ summary: 'Add an email to the admin alert list' })
  async addRecipient(
    @Body() dto: AddNotificationRecipientDto,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.unwrap(
      await this.recipientsService.addRecipient(dto, req.user.id, ipAddress, userAgent),
    );
  }

  @Delete(':recipientId')
  @ApiOperation({ summary: 'Remove an email from the admin alert list' })
  async removeRecipient(
    @Param('recipientId') recipientId: string,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.unwrap(
      await this.recipientsService.removeRecipient(recipientId, req.user.id, ipAddress, userAgent),
    );
  }

  private unwrap(response: ResponseDto): ResponseDto {
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }
}
