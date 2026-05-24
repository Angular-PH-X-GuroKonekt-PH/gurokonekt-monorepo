import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@gurokonekt/models';

export interface BookingMetrics {
  total: number;
  byStatus: Record<BookingStatus, number>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBookingMetrics(): Promise<BookingMetrics> {
    const statuses = Object.values(BookingStatus);

    const [total, ...statusCounts] = await this.prisma.db.$transaction([
      this.prisma.db.booking.count(),
      ...statuses.map((status) =>
        this.prisma.db.booking.count({ where: { status } }),
      ),
    ]);

    const byStatus = statuses.reduce(
      (acc, status, index) => {
        acc[status] = statusCounts[index];
        return acc;
      },
      {} as Record<BookingStatus, number>,
    );

    return { total, byStatus };
  }
}
