import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from './api-key.guard';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // ====================================================
  // GET - Booking metrics (Grafana / internal only)
  // ====================================================

  @Get('bookings')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({
    summary: 'Get booking metrics (internal — API key required)',
    description:
      'Returns aggregated booking counts grouped by status. ' +
      'This endpoint is intended for Grafana and requires a valid ' +
      '`X-API-Key` header matching the `METRICS_API_KEY` environment variable.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking metrics retrieved successfully.',
    schema: {
      example: {
        status: 'success',
        statusCode: 200,
        message: 'Booking metrics retrieved successfully',
        data: {
          total: 120,
          byStatus: {
            PENDING: 30,
            APPROVED: 50,
            REJECTED: 15,
            COMPLETED: 25,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid X-API-Key header.',
  })
  async getBookingMetrics() {
    return this.metricsService.getBookingMetrics();
  }
}
