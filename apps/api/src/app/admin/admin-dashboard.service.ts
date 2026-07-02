import { Injectable, Logger } from '@nestjs/common';
import { API_RESPONSE, ResponseDto, ResponseStatus, UserRole, UserStatus } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GetGrowthChartQueryDto } from '@gurokonekt/models';

type GrowthPeriod = 'daily' | 'weekly' | 'monthly' | 'annually';
type GrowthWindow = '7d' | '30d' | '3m' | '6m' | '12m';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async getDashboard(): Promise<ResponseDto> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalMentors,
        totalMentees,
        pendingMentorApprovals,
        activeBookings,
        completedSessions,
        newMentorsThisMonth,
        newMenteesThisMonth,
        unverifiedEmailAccounts,
      ] = await Promise.all([
        // "Total Mentors" counts approved mentors only — pending/rejected/inactive
        // mentors are not yet active on the platform.
        this.prisma.db.user.count({ where: { role: UserRole.Mentor, status: UserStatus.Approved } }),
        this.prisma.db.user.count({ where: { role: UserRole.Mentee } }),
        this.prisma.db.user.count({
          where: {
            role: UserRole.Mentor,
            status: { in: [UserStatus.PendingApproval, UserStatus.PendingReview] },
          },
        }),
        this.prisma.db.booking.count({ where: { status: 'APPROVED', isDeleted: false } }),
        this.prisma.db.booking.count({ where: { status: 'COMPLETED', isDeleted: false } }),
        this.prisma.db.user.count({
          where: { role: UserRole.Mentor, createdAt: { gte: startOfMonth } },
        }),
        this.prisma.db.user.count({
          where: { role: UserRole.Mentee, createdAt: { gte: startOfMonth } },
        }),
        this.supabase.countUnverifiedEmailAccounts(),
      ]);

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_DASHBOARD.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_DASHBOARD.message,
        data: {
          totalMentors,
          totalMentees,
          totalUsers: totalMentors + totalMentees,
          pendingMentorApprovals,
          activeBookings,
          completedSessions,
          newMentorsThisMonth,
          newMenteesThisMonth,
          unverifiedEmailAccounts,
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_DASHBOARD.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_DASHBOARD.message,
        data: error,
      };
    }
  }

  async getGrowthChart(query: GetGrowthChartQueryDto): Promise<ResponseDto> {
    try {
      const metric = query.metric ?? 'all';
      const period: GrowthPeriod = query.period ?? 'monthly';
      const window: GrowthWindow = query.window ?? '6m';

      const since = this.windowToDate(window);
      const now = new Date();

      const [users, bookings] = await Promise.all([
        metric !== 'bookings'
          ? this.prisma.db.user.findMany({
              where: {
                role: { in: [UserRole.Mentor, UserRole.Mentee] },
                createdAt: { gte: since },
              },
              select: { createdAt: true },
            })
          : Promise.resolve([]),
        metric !== 'registrations'
          ? this.prisma.db.booking.findMany({
              where: { createdAt: { gte: since }, isDeleted: false },
              select: { createdAt: true },
            })
          : Promise.resolve([]),
      ]);

      const labels = this.buildLabels(since, now, period);
      const points = labels.map((label) => {
        const registrations = metric !== 'bookings'
          ? users.filter((u) => this.getLabel(u.createdAt, period) === label).length
          : undefined;
        const bookingCount = metric !== 'registrations'
          ? bookings.filter((b) => this.getLabel(b.createdAt, period) === label).length
          : undefined;

        return {
          label,
          ...(registrations !== undefined && { registrations }),
          ...(bookingCount !== undefined && { bookings: bookingCount }),
        };
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_GROWTH_CHART.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_GROWTH_CHART.message,
        data: { metric, period, window, points },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_GROWTH_CHART.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_GROWTH_CHART.message,
        data: error,
      };
    }
  }

  private windowToDate(window: GrowthWindow): Date {
    const now = new Date();
    switch (window) {
      case '7d':  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3m':  return new Date(now.getFullYear(), now.getMonth() - 3, 1);
      case '6m':  return new Date(now.getFullYear(), now.getMonth() - 6, 1);
      case '12m': return new Date(now.getFullYear(), now.getMonth() - 12, 1);
    }
  }

  private getLabel(date: Date, period: GrowthPeriod): string {
    switch (period) {
      case 'daily':
        return date.toISOString().slice(0, 10);
      case 'weekly': {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return d.toISOString().slice(0, 10);
      }
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'annually':
        return String(date.getFullYear());
    }
  }

  private buildLabels(since: Date, until: Date, period: GrowthPeriod): string[] {
    const labels: string[] = [];
    const cursor = new Date(since);

    while (cursor <= until) {
      const label = this.getLabel(cursor, period);
      if (!labels.includes(label)) labels.push(label);

      switch (period) {
        case 'daily':
          cursor.setDate(cursor.getDate() + 1);
          break;
        case 'weekly':
          cursor.setDate(cursor.getDate() + 7);
          break;
        case 'monthly':
          cursor.setMonth(cursor.getMonth() + 1);
          break;
        case 'annually':
          cursor.setFullYear(cursor.getFullYear() + 1);
          break;
      }
    }

    return labels;
  }
}
