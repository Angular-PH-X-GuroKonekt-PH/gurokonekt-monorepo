import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ListInquiriesQueryDto,
  ResponseStatus,
  SWAGGER_DOCUMENTATION,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AdminInquiryService } from './admin-inquiry.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/inquiries')
export class AdminInquiryController {
  constructor(private readonly adminInquiryService: AdminInquiryService) {}

  @Get()
  @ApiOperation({
    summary: SWAGGER_DOCUMENTATION.ADMIN_GET_INQUIRIES.summary,
    description: SWAGGER_DOCUMENTATION.ADMIN_GET_INQUIRIES.description,
  })
  async getInquiries(@Query() query: ListInquiriesQueryDto) {
    const response = await this.adminInquiryService.getInquiries(query);
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
