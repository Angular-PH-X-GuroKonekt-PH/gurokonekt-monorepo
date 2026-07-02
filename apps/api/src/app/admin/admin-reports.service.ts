import { Injectable, Logger } from '@nestjs/common';
import { API_RESPONSE, ResponseDto, ResponseStatus, UserRole, UserStatus } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminReportsService {
  private readonly logger = new Logger(AdminReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async getOverview(): Promise<ResponseDto> {
    try {
      const [
        totalMentors,
        totalMentees,
        approvedMentors,
        pendingMentors,
        rejectedMentors,
        inactiveMentors,
        bookingGroups,
        mentorProfilesWithRate,
        unverifiedEmailAccounts,
      ] = await Promise.all([
        this.prisma.db.user.count({ where: { role: UserRole.Mentor } }),
        this.prisma.db.user.count({ where: { role: UserRole.Mentee } }),
        this.prisma.db.user.count({ where: { role: UserRole.Mentor, status: UserStatus.Approved } }),
        this.prisma.db.user.count({
          where: { role: UserRole.Mentor, status: { in: [UserStatus.PendingApproval, UserStatus.PendingReview] } },
        }),
        this.prisma.db.user.count({ where: { role: UserRole.Mentor, status: UserStatus.Rejected } }),
        this.prisma.db.user.count({ where: { role: UserRole.Mentor, status: UserStatus.Inactive } }),
        this.prisma.db.booking.groupBy({
          by: ['status'],
          where: { isDeleted: false },
          _count: { _all: true },
        }),
        this.prisma.db.mentorProfile.findMany({
          where: { sessionRate: { not: null } },
          select: { sessionRate: true },
        }),
        this.supabase.countUnverifiedEmailAccounts(),
      ]);

      const byStatus: Record<string, number> = {};
      let totalBookings = 0;
      for (const g of bookingGroups) {
        byStatus[g.status] = g._count._all;
        totalBookings += g._count._all;
      }

      const completed = byStatus['COMPLETED'] ?? 0;
      const cancelled = byStatus['CANCELLED'] ?? 0;
      const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;
      const cancellationRate = totalBookings > 0 ? Math.round((cancelled / totalBookings) * 100) : 0;

      const rates = mentorProfilesWithRate.map((p) => p.sessionRate!);
      const averageSessionRate = rates.length > 0
        ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100
        : 0;

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_REPORTS_OVERVIEW.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_REPORTS_OVERVIEW.message,
        data: {
          users: {
            totalMentors,
            totalMentees,
            total: totalMentors + totalMentees,
            unverifiedEmailAccounts,
            mentors: { approved: approvedMentors, pending: pendingMentors, rejected: rejectedMentors, inactive: inactiveMentors },
          },
          sessions: {
            total: totalBookings,
            byStatus,
            completionRate,
            cancellationRate,
          },
          averageSessionRate,
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_REPORTS_OVERVIEW.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_REPORTS_OVERVIEW.message,
        data: error,
      };
    }
  }

  async getSessions(): Promise<ResponseDto> {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const [bookingGroups, upcomingThisWeek] = await Promise.all([
        this.prisma.db.booking.groupBy({
          by: ['status'],
          where: { isDeleted: false },
          _count: { _all: true },
        }),
        this.prisma.db.booking.count({
          where: {
            status: 'APPROVED',
            isDeleted: false,
            sessionDateTime: { gte: now, lte: endOfWeek },
          },
        }),
      ]);

      const byStatus: Record<string, number> = {};
      let total = 0;
      for (const g of bookingGroups) {
        byStatus[g.status] = g._count._all;
        total += g._count._all;
      }

      const completed = byStatus['COMPLETED'] ?? 0;
      const cancelled = byStatus['CANCELLED'] ?? 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_REPORTS_SESSIONS.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_REPORTS_SESSIONS.message,
        data: { total, byStatus, completionRate, cancellationRate, upcomingThisWeek },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_REPORTS_SESSIONS.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_REPORTS_SESSIONS.message,
        data: error,
      };
    }
  }

  async getMentors(): Promise<ResponseDto> {
    try {
      const [statusGroups, completedByMentor, mentorData] = await Promise.all([
        this.prisma.db.user.groupBy({
          by: ['status'],
          where: { role: UserRole.Mentor },
          _count: { _all: true },
        }),
        this.prisma.db.booking.groupBy({
          by: ['mentorId'],
          where: { status: 'COMPLETED', isDeleted: false },
          _count: { _all: true },
          orderBy: { _count: { mentorId: 'desc' } },
          take: 5,
        }),
        this.prisma.db.user.findMany({
          where: { role: UserRole.Mentor, status: UserStatus.Approved },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mentorProfiles: { select: { sessionRate: true }, take: 1 },
          },
        }),
      ]);

      const byStatus: Record<string, number> = {};
      let total = 0;
      for (const g of statusGroups) {
        byStatus[g.status] = g._count._all;
        total += g._count._all;
      }

      const mentorMap = new Map(mentorData.map((m) => [m.id, m]));
      const top = completedByMentor
        .map((b) => {
          const m = mentorMap.get(b.mentorId);
          if (!m) return null;
          return {
            id: m.id,
            name: `${m.firstName} ${m.lastName}`,
            completedSessions: b._count._all,
            sessionRate: m.mentorProfiles[0]?.sessionRate ?? null,
          };
        })
        .filter(Boolean);

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.ADMIN_GET_REPORTS_MENTORS.code,
        message: API_RESPONSE.SUCCESS.ADMIN_GET_REPORTS_MENTORS.message,
        data: { total, byStatus, topByCompletedSessions: top },
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.ADMIN_GET_REPORTS_MENTORS.code,
        message: API_RESPONSE.ERROR.ADMIN_GET_REPORTS_MENTORS.message,
        data: error,
      };
    }
  }
}
