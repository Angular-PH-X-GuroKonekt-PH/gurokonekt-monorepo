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
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  AdminRejectMentorDto,
  ListMentorsQueryDto,
  ResponseStatus,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AdminMentorService } from './admin-mentor.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/mentors')
export class AdminMentorController {
  constructor(private readonly adminMentorService: AdminMentorService) {}

  @Get()
  @ApiOperation({ summary: 'List all mentor accounts with filters and pagination' })
  async getMentors(@Query() query: ListMentorsQueryDto) {
    const response = await this.adminMentorService.getMentors(query);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Get(':mentorId/rejection-log')
  @ApiOperation({ summary: 'Get the most recent rejection log for a mentor' })
  async getMentorRejectionLog(@Param('mentorId') mentorId: string) {
    const response = await this.adminMentorService.getMentorRejectionLog(mentorId);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Get(':mentorId/deactivation-feedback')
  @ApiOperation({ summary: 'Get self-submitted deactivation feedback for a mentor' })
  async getMentorDeactivationFeedback(@Param('mentorId') mentorId: string) {
    const response = await this.adminMentorService.getMentorDeactivationFeedback(mentorId);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Get(':mentorId')
  @ApiOperation({ summary: 'Get full mentor profile details including documents' })
  async getMentorById(@Param('mentorId') mentorId: string) {
    const response = await this.adminMentorService.getMentorById(mentorId);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Patch(':mentorId/approve')
  @ApiOperation({ summary: 'Approve a pending mentor account' })
  async approveMentor(
    @Param('mentorId') mentorId: string,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.adminMentorService.approveMentor(
      mentorId,
      req.user.id,
      ipAddress,
      userAgent,
    );
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Patch(':mentorId/reject')
  @ApiOperation({ summary: 'Reject a pending mentor account with a reason' })
  async rejectMentor(
    @Param('mentorId') mentorId: string,
    @Body() dto: AdminRejectMentorDto,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.adminMentorService.rejectMentor(
      mentorId,
      dto,
      req.user.id,
      ipAddress,
      userAgent,
    );
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Patch(':mentorId/deactivate')
  @ApiOperation({ summary: 'Deactivate an approved mentor account' })
  async deactivateMentor(
    @Param('mentorId') mentorId: string,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.adminMentorService.deactivateMentor(
      mentorId,
      req.user.id,
      ipAddress,
      userAgent,
    );
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }
}
