import { Injectable } from '@nestjs/common';
import { AchievementCriterion, AchievementMetric } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';

export type MentorMetrics = Record<AchievementMetric, number>;

const EMPTY_METRICS: MentorMetrics = {
  [AchievementMetric.CompletedSessions]: 0,
  [AchievementMetric.AverageRating]: 0,
  [AchievementMetric.ReviewCount]: 0,
  [AchievementMetric.YearsOfExperience]: 0,
};

/** The platform numbers automatic achievements are judged on. */
@Injectable()
export class AchievementMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Metrics for many mentors at once (one query per metric, not per mentor). */
  async getMetrics(mentorIds: string[]): Promise<Map<string, MentorMetrics>> {
    const metrics = new Map<string, MentorMetrics>(
      mentorIds.map((id) => [id, { ...EMPTY_METRICS }]),
    );
    if (!mentorIds.length) return metrics;

    const [completed, feedback, profiles] = await Promise.all([
      this.prisma.db.booking.groupBy({
        by: ['mentorId'],
        where: { mentorId: { in: mentorIds }, status: 'COMPLETED', isDeleted: false },
        _count: { _all: true },
      }),
      // Only ratings mentees gave the mentor count, not the mentor's own feedback.
      this.prisma.db.bookingFeedback.findMany({
        where: { booking: { mentorId: { in: mentorIds }, isDeleted: false } },
        select: { rating: true, userId: true, booking: { select: { mentorId: true, menteeId: true } } },
      }),
      this.prisma.db.mentorProfile.findMany({
        where: { userId: { in: mentorIds } },
        select: { userId: true, yearsOfExperience: true },
      }),
    ]);

    for (const row of completed) {
      metrics.get(row.mentorId)![AchievementMetric.CompletedSessions] = row._count._all;
    }

    const ratingTotals = new Map<string, number>();
    for (const row of feedback) {
      if (row.userId !== row.booking.menteeId) continue;
      const m = metrics.get(row.booking.mentorId)!;
      m[AchievementMetric.ReviewCount] += 1;
      ratingTotals.set(row.booking.mentorId, (ratingTotals.get(row.booking.mentorId) ?? 0) + row.rating);
    }
    for (const [mentorId, total] of ratingTotals) {
      const m = metrics.get(mentorId)!;
      m[AchievementMetric.AverageRating] = Math.round((total / m[AchievementMetric.ReviewCount]) * 10) / 10;
    }

    for (const profile of profiles) {
      metrics.get(profile.userId)![AchievementMetric.YearsOfExperience] = profile.yearsOfExperience ?? 0;
    }

    return metrics;
  }

  static meetsAll(criteria: AchievementCriterion[], metrics: MentorMetrics): boolean {
    return criteria.length > 0 && criteria.every((c) => (metrics[c.metric] ?? 0) >= c.min);
  }
}
