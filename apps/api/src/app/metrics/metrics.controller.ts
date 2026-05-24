import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MetricsService, BookingMetrics } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // ====================================================
  // GET /api/metrics/bookings — public, no JWT required
  // ====================================================

  @Get('bookings')
  @ApiOperation({
    summary: 'Get aggregated booking metrics (public)',
    description:
      'Returns booking counts grouped by status and a total count. ' +
      'This endpoint is intentionally public to allow Grafana and other ' +
      'monitoring tools to scrape booking pipeline statistics without authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking metrics retrieved successfully.',
    schema: {
      example: {
        total: 42,
        byStatus: {
          PENDING: 10,
          APPROVED: 15,
          COMPLETED: 12,
          REJECTED: 3,
          CANCELLED: 1,
          DELETED: 1,
        },
      },
    },
  })
  async getBookingMetrics(): Promise<BookingMetrics> {
    return this.metricsService.getBookingMetrics();
  }
}
