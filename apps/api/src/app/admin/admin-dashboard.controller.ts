import { Controller, Get, HttpException, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetGrowthChartQueryDto, ResponseStatus } from '@gurokonekt/models';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { AdminGuard } from '../jwt-guard/admin.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuardGuard, AdminGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin dashboard key metrics' })
  async getDashboard() {
    const response = await this.dashboardService.getDashboard();
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get platform growth chart data (registrations and/or bookings)' })
  async getGrowthChart(@Query() query: GetGrowthChartQueryDto) {
    const response = await this.dashboardService.getGrowthChart(query);
    if (response.status === ResponseStatus.Error) {
      throw new HttpException(
        { status: response.status, statusCode: response.statusCode, message: response.message, data: response.data },
        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return response;
  }
}
