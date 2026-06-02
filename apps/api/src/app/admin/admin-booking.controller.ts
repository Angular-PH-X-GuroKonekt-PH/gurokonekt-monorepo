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
  AdminForceCancelBookingDto,
  AdminListBookingsQueryDto,
  ResponseStatus,
} from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AdminBookingService } from './admin-booking.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/bookings')
export class AdminBookingController {
  constructor(private readonly adminBookingService: AdminBookingService) {}

  @Get()
  @ApiOperation({ summary: 'List all bookings with filters and pagination' })
  async listBookings(@Query() query: AdminListBookingsQueryDto) {
    const response = await this.adminBookingService.listBookings(query);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get full booking details (includes feedback if completed, cancel reason if cancelled)' })
  async getBookingById(@Param('bookingId') bookingId: string) {
    const response = await this.adminBookingService.getBookingById(bookingId);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Patch(':bookingId/force-cancel')
  @ApiOperation({ summary: 'Force-cancel a booking (admin override for disputes)' })
  async forceCancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() dto: AdminForceCancelBookingDto,
    @Request() req: { user: { id: string } },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const response = await this.adminBookingService.forceCancelBooking(
      bookingId,
      dto.reason,
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
