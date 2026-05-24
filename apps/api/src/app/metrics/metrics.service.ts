import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseStatus } from '@gurokonekt/models';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBookingMetrics() {
    try {
      const groups = await this.prisma.db.booking.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { _all: true },
      });

      const byStatus: Record<string, number> = {};
      let total = 0;

      for (const group of groups) {
        byStatus[group.status] = group._count._all;
        total += group._count._all;
      }

      return {
        status: ResponseStatus.Success,
        statusCode: 200,
        message: 'Booking metrics retrieved successfully',
        data: { total, byStatus },
      };
    } catch (error) {
      this.logger.error('Failed to retrieve booking metrics', error);
      return {
        status: ResponseStatus.Error,
        statusCode: 500,
        message: 'Failed to retrieve booking metrics',
        data: null,
      };
    }
  }
}
