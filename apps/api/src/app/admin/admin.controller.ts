import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  AdminRejectMenteeDto,
  ListMenteesQueryDto,
  ResponseStatus,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/mentees')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all mentees with filters and pagination' })
  async getMentees(@Query() query: ListMenteesQueryDto) {
    const response = await this.adminService.getMentees(query);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException({ status: response.status, statusCode: response.statusCode, message: response.message, data: response.data }, response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return response;
  }

  @Get(':menteeId')
  @ApiOperation({ summary: 'Get full profile of a mentee' })
  async getMenteeById(@Param('menteeId') menteeId: string) {
    const response = await this.adminService.getMenteeById(menteeId);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException({ status: response.status, statusCode: response.statusCode, message: response.message, data: response.data }, response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return response;
  }

  @Get(':menteeId/rejection-log')
  @ApiOperation({ summary: 'Get the latest rejection reason for a mentee' })
  async getRejectionLog(@Param('menteeId') menteeId: string) {
    const response = await this.adminService.getRejectionLog(menteeId);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException({ status: response.status, statusCode: response.statusCode, message: response.message, data: response.data }, response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return response;
  }

  @Patch(':menteeId/activate')
  @ApiOperation({ summary: 'Bypass-activate a mentee account' })
  async activateMentee(
    @Param('menteeId') menteeId: string,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.adminService.activateMentee(menteeId, req.user.id, ipAddress, userAgent);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException({ status: response.status, statusCode: response.statusCode, message: response.message, data: response.data }, response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return response;
  }

  @Patch(':menteeId/deactivate')
  @ApiOperation({ summary: 'Deactivate a mentee account' })
  async deactivateMentee(
    @Param('menteeId') menteeId: string,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.adminService.deactivateMentee(menteeId, req.user.id, ipAddress, userAgent);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException({ status: response.status, statusCode: response.statusCode, message: response.message, data: response.data }, response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return response;
  }

  @Patch(':menteeId/reject')
  @ApiOperation({ summary: 'Reject a mentee account with a reason' })
  async rejectMentee(
    @Param('menteeId') menteeId: string,
    @Body() dto: AdminRejectMenteeDto,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.adminService.rejectMentee(menteeId, dto.reason, req.user.id, ipAddress, userAgent);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException({ status: response.status, statusCode: response.statusCode, message: response.message, data: response.data }, response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return response;
  }

  @Post(':menteeId/resend-verification')
  @ApiOperation({ summary: 'Resend email verification OTP to a mentee' })
  async resendVerification(
    @Param('menteeId') menteeId: string,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.adminService.resendVerification(menteeId, req.user.id, ipAddress, userAgent);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException({ status: response.status, statusCode: response.statusCode, message: response.message, data: response.data }, response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return response;
  }
}
