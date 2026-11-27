import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import {
  API_RESPONSE,
  AdminBadgeInterface,
  AwardBadgeDto,
  BADGE_DEFINITIONS,
  BadgeCategory,
  BadgeInterface,
  BadgeRequirementType,
  BookingStatus,
  LogsActionType,
  ResponseDto,
  ResponseStatus,
  SUPPORTED_BADGE_REQUIREMENTS,
  SetFeaturedBadgesDto,
  UpdateBadgeDto,
  UserAchievementsInterface,
  UserBadgeInterface,
  UserRole,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';

type ApiError = keyof typeof API_RESPONSE.ERROR;
type ApiSuccess = keyof typeof API_RESPONSE.SUCCESS;
export type Actor = { id: string; ipAddress: string; userAgent: string };
export type BadgeMetrics = Partial<Record<BadgeRequirementType, number>>;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Unix epoch is a Thursday; shifting by 3 days makes weeks run Monday–Sunday (UTC).
const EPOCH_TO_MONDAY_MS = 3 * 24 * 60 * 60 * 1000;
// Let the app finish booting before the startup backfill.
const BACKFILL_DELAY_MS = 60 * 1000;

const ROLE_CATEGORIES: Record<string, BadgeCategory[]> = {
  [UserRole.Mentor]: [BadgeCategory.Mentor],
  [UserRole.Mentee]: [BadgeCategory.Mentee],
};

/** Longest run of consecutive calendar weeks (Mon–Sun, UTC) with at least one date. */
export function longestWeeklyStreak(dates: Date[]): number {
  const weeks = [...new Set(dates.map((d) => Math.floor((d.getTime() + EPOCH_TO_MONDAY_MS) / WEEK_MS)))].sort(
    (a, b) => a - b,
  );
  let best = 0;
  let run = 0;
  weeks.forEach((week, i) => {
    run = i > 0 && week === weeks[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

@Injectable()
export class BadgesService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(BadgesService.name);
  private backfillTimer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  // ====================================================
  // STARTUP: SEED + BACKFILL
  // ====================================================

  onApplicationBootstrap(): void {
    this.backfillTimer = setTimeout(() => void this.seedAndBackfill(), BACKFILL_DELAY_MS);
    this.backfillTimer.unref();
  }

  onModuleDestroy(): void {
    clearTimeout(this.backfillTimer);
  }

  async seedAndBackfill(): Promise<void> {
    await this.seedBadges();
    await this.evaluateAll();
  }

  /** Inserts missing badge definitions. Existing rows (and admin edits) are left alone. */
  async seedBadges(): Promise<number> {
    try {
      const { count } = await this.prisma.db.badge.createMany({ data: BADGE_DEFINITIONS, skipDuplicates: true });
      if (count) this.logger.log(`Seeded ${count} badge definition(s)`);
      return count;
    } catch (error: any) {
      this.logger.error(`Badge seeding failed: ${error?.message}`, error?.stack);
      return 0;
    }
  }

  // ====================================================
  // EVALUATION
  // ====================================================

  /** Counts a user's valid activity for every supported requirement type. */
  async getMetrics(userId: string): Promise<BadgeMetrics> {
    const valid = { status: BookingStatus.COMPLETED, isDeleted: false };
    const [asMentor, asMentee, fiveStarReviews] = await Promise.all([
      this.prisma.db.booking.findMany({
        where: { mentorId: userId, ...valid },
        select: { menteeId: true, sessionDateTime: true },
      }),
      this.prisma.db.booking.findMany({
        where: { menteeId: userId, ...valid },
        select: { mentorId: true, sessionDateTime: true, feedback: { where: { userId }, select: { id: true } } },
      }),
      // Reviews are written by the session's mentee, so another user's 5-star on this mentor's booking.
      this.prisma.db.bookingFeedback.count({
        where: { rating: 5, userId: { not: userId }, booking: { mentorId: userId, ...valid } },
      }),
    ]);

    return {
      [BadgeRequirementType.MentorCompletedSessions]: asMentor.length,
      [BadgeRequirementType.MentorUniqueMentees]: new Set(asMentor.map((b) => b.menteeId)).size,
      [BadgeRequirementType.MentorConsecutiveWeeks]: longestWeeklyStreak(asMentor.map((b) => b.sessionDateTime)),
      [BadgeRequirementType.MentorFiveStarReviews]: fiveStarReviews,
      [BadgeRequirementType.MenteeCompletedSessions]: asMentee.length,
      [BadgeRequirementType.MenteeUniqueMentors]: new Set(asMentee.map((b) => b.mentorId)).size,
      [BadgeRequirementType.MenteeConsecutiveWeeks]: longestWeeklyStreak(asMentee.map((b) => b.sessionDateTime)),
      [BadgeRequirementType.MenteeReviewedSessions]: asMentee.filter((b) => b.feedback.length > 0).length,
    };
  }

  /**
   * Recomputes one user's progress and unlocks badges whose target is reached.
   * Idempotent: an unlocked badge is never touched again, and the unlock only
   * applies to a row that is still locked, so repeated or concurrent runs
   * can't unlock twice. Never throws.
   */
  async evaluateUser(userId: string): Promise<void> {
    try {
      const [badges, rows, metrics] = await Promise.all([
        this.prisma.db.badge.findMany({
          where: {
            active: true,
            category: { not: BadgeCategory.Special },
            requirementType: { in: SUPPORTED_BADGE_REQUIREMENTS },
          },
        }),
        this.prisma.db.userBadge.findMany({ where: { userId } }),
        this.getMetrics(userId),
      ]);
      const rowByBadge = new Map(rows.map((r) => [r.badgeId, r]));
      const now = new Date();

      for (const badge of badges) {
        const row = rowByBadge.get(badge.id);
        if (row?.unlocked) continue;

        const target = badge.requirementValue;
        const progress = Math.min(metrics[badge.requirementType as BadgeRequirementType] ?? 0, target);
        const unlocked = progress >= target;
        if (!row && progress === 0) continue;
        if (row && !unlocked && row.progress === progress && row.target === target) continue;

        const data = { progress, target, ...(unlocked ? { unlocked: true, unlockedAt: now } : {}) };
        if (row) {
          await this.prisma.db.userBadge.updateMany({ where: { id: row.id, unlocked: false }, data });
        } else {
          await this.prisma.db.userBadge
            .create({ data: { userId, badgeId: badge.id, ...data } })
            // A concurrent evaluation created it first; that run's result stands.
            .catch((error) => {
              if (error?.code !== 'P2002') throw error;
            });
        }
      }
    } catch (error: any) {
      this.logger.error(`Badge evaluation failed for user ${userId}: ${error?.message}`, error?.stack);
    }
  }

  /** Fire-and-forget hook for activity events (booking completed, review left). */
  evaluateUsers(userIds: string[]): void {
    void Promise.all([...new Set(userIds)].map((id) => this.evaluateUser(id)));
  }

  /** Backfill: evaluates every user with completed sessions. Returns how many. */
  async evaluateAll(): Promise<number> {
    try {
      const bookings = await this.prisma.db.booking.findMany({
        where: { status: BookingStatus.COMPLETED, isDeleted: false },
        select: { mentorId: true, menteeId: true },
      });
      const userIds = [...new Set(bookings.flatMap((b) => [b.mentorId, b.menteeId]))];
      // Sequential to keep database load flat.
      for (const id of userIds) await this.evaluateUser(id);
      this.logger.log(`Evaluated badges for ${userIds.length} user(s)`);
      return userIds.length;
    } catch (error: any) {
      this.logger.error(`Badge backfill failed: ${error?.message}`, error?.stack);
      return 0;
    }
  }

  // ====================================================
  // USER
  // ====================================================

  async getUserAchievements(userId: string): Promise<ResponseDto> {
    try {
      const [user, badges, rows] = await Promise.all([
        this.prisma.db.user.findUnique({ where: { id: userId }, select: { role: true } }),
        this.prisma.db.badge.findMany({ orderBy: [{ category: 'asc' }, { requirementValue: 'asc' }] }),
        this.prisma.db.userBadge.findMany({ where: { userId } }),
      ]);
      if (!user) return this.err('USER_NOT_FOUND');

      const roleCategories = ROLE_CATEGORIES[user.role] ?? [];
      const rowByBadge = new Map(rows.map((r) => [r.badgeId, r]));

      const items: UserBadgeInterface[] = badges
        .filter((b) => {
          const row = rowByBadge.get(b.id);
          // Unlocked badges stay visible even if later disabled; special badges only once awarded.
          if (row?.unlocked) return true;
          if (!b.active || b.category === BadgeCategory.Special) return false;
          return roleCategories.includes(b.category as BadgeCategory) || !!row;
        })
        .map((b) => {
          const row = rowByBadge.get(b.id);
          return {
            badgeId: b.id,
            code: b.code,
            name: b.name,
            description: b.description,
            category: b.category as BadgeCategory,
            rarity: b.rarity as UserBadgeInterface['rarity'],
            requirementType: b.requirementType,
            progress: row?.progress ?? 0,
            target: row?.unlocked ? row.target : b.requirementValue,
            unlocked: row?.unlocked ?? false,
            unlockedAt: row?.unlockedAt ?? null,
            featured: row?.featured ?? false,
          };
        });

      const data: UserAchievementsInterface = {
        unlockedCount: items.filter((i) => i.unlocked).length,
        totalCount: items.length,
        featured: items.filter((i) => i.featured),
        badges: items,
      };
      return this.ok('GET_MY_BADGES', data);
    } catch (error) {
      return this.fail('GET_MY_BADGES', error);
    }
  }

  /** Replaces the featured selection. Each badge must be unlocked by this user. */
  async setFeatured(userId: string, dto: SetFeaturedBadgesDto): Promise<ResponseDto> {
    try {
      const badgeIds = dto.badgeIds;
      const owned = await this.prisma.db.userBadge.count({
        where: { userId, badgeId: { in: badgeIds }, unlocked: true },
      });
      if (owned !== badgeIds.length) return this.err('BADGE_NOT_UNLOCKED');

      await this.prisma.db.$transaction([
        this.prisma.db.userBadge.updateMany({
          where: { userId, featured: true, badgeId: { notIn: badgeIds } },
          data: { featured: false },
        }),
        this.prisma.db.userBadge.updateMany({
          where: { userId, badgeId: { in: badgeIds }, unlocked: true },
          data: { featured: true },
        }),
      ]);
      return this.getUserAchievements(userId).then((r) =>
        r.status === ResponseStatus.Success ? this.ok('UPDATE_FEATURED_BADGES', r.data) : r,
      );
    } catch (error) {
      return this.fail('UPDATE_FEATURED_BADGES', error);
    }
  }

  // ====================================================
  // ADMIN
  // ====================================================

  async listBadges(category?: BadgeCategory): Promise<ResponseDto> {
    try {
      const badges = await this.prisma.db.badge.findMany({
        where: category ? { category } : {},
        orderBy: [{ category: 'asc' }, { requirementValue: 'asc' }],
        include: { _count: { select: { userBadges: { where: { unlocked: true } } } } },
      });
      const data: AdminBadgeInterface[] = badges.map(({ _count, createdAt, updatedAt, ...b }) => ({
        ...(b as BadgeInterface),
        unlockedCount: _count.userBadges,
      }));
      return this.ok('ADMIN_GET_BADGES', data);
    } catch (error) {
      return this.fail('ADMIN_GET_BADGES', error);
    }
  }

  async updateBadge(badgeId: string, dto: UpdateBadgeDto, actor: Actor): Promise<ResponseDto> {
    try {
      const existing = await this.prisma.db.badge.findUnique({ where: { id: badgeId } });
      if (!existing) return this.err('BADGE_NOT_FOUND');

      const next = { ...existing, ...dto };
      const tracked =
        next.category === BadgeCategory.Special ||
        SUPPORTED_BADGE_REQUIREMENTS.includes(next.requirementType as BadgeRequirementType);
      if (next.active && !tracked) return this.err('BADGE_REQUIREMENT_UNSUPPORTED');

      const updated = await this.prisma.db.$transaction(async (tx) => {
        const badge = await tx.badge.update({ where: { id: badgeId }, data: dto });
        await tx.logs.create({
          data: {
            actionType: LogsActionType.AdminUpdateBadge,
            targetId: badgeId,
            details: API_RESPONSE.SUCCESS.ADMIN_UPDATE_BADGE.message,
            metadata: { code: existing.code, changes: { ...dto } },
            ipAddress: actor.ipAddress ?? '',
            userAgent: actor.userAgent ?? '',
            createdById: actor.id,
          },
        });
        return badge;
      });

      // A new target or a newly enabled badge changes everyone's progress.
      const affectsProgress =
        (dto.requirementValue !== undefined && dto.requirementValue !== existing.requirementValue) ||
        (dto.requirementType !== undefined && dto.requirementType !== existing.requirementType) ||
        (dto.active === true && !existing.active);
      if (affectsProgress) void this.evaluateAll();

      const { createdAt, updatedAt, ...data } = updated;
      return this.ok('ADMIN_UPDATE_BADGE', data);
    } catch (error) {
      return this.fail('ADMIN_UPDATE_BADGE', error);
    }
  }

  async awardSpecialBadge(badgeId: string, dto: AwardBadgeDto, actor: Actor): Promise<ResponseDto> {
    try {
      const [badge, user] = await Promise.all([
        this.prisma.db.badge.findUnique({ where: { id: badgeId } }),
        this.prisma.db.user.findUnique({ where: { id: dto.userId }, select: { id: true } }),
      ]);
      if (!badge) return this.err('BADGE_NOT_FOUND');
      if (badge.category !== BadgeCategory.Special || !badge.active) return this.err('BADGE_NOT_SPECIAL');
      if (!user) return this.err('USER_NOT_FOUND');

      const awarded = await this.prisma.db.$transaction(async (tx) => {
        const row = await tx.userBadge.create({
          data: {
            userId: dto.userId,
            badgeId,
            progress: badge.requirementValue,
            target: badge.requirementValue,
            unlocked: true,
            unlockedAt: new Date(),
            awardedById: actor.id,
          },
        });
        await tx.logs.create({
          data: {
            actionType: LogsActionType.AdminAwardBadge,
            targetId: row.id,
            details: API_RESPONSE.SUCCESS.ADMIN_AWARD_BADGE.message,
            metadata: { badgeId, code: badge.code, userId: dto.userId },
            ipAddress: actor.ipAddress ?? '',
            userAgent: actor.userAgent ?? '',
            createdById: actor.id,
          },
        });
        return row;
      });
      return this.ok('ADMIN_AWARD_BADGE', awarded);
    } catch (error: any) {
      // The [userId, badgeId] unique constraint is the duplicate guard.
      if (error?.code === 'P2002') return this.err('BADGE_ALREADY_AWARDED');
      return this.fail('ADMIN_AWARD_BADGE', error);
    }
  }

  async runBackfill(): Promise<ResponseDto> {
    try {
      await this.seedBadges();
      const usersEvaluated = await this.evaluateAll();
      return this.ok('ADMIN_EVALUATE_BADGES', { usersEvaluated });
    } catch (error) {
      return this.fail('ADMIN_EVALUATE_BADGES', error);
    }
  }

  // ====================================================
  // HELPERS
  // ====================================================

  private ok(key: ApiSuccess, data: unknown): ResponseDto {
    const { code, message } = API_RESPONSE.SUCCESS[key];
    return { status: ResponseStatus.Success, statusCode: code, message, data };
  }

  private err(key: ApiError): ResponseDto {
    const { code, message } = API_RESPONSE.ERROR[key];
    return { status: ResponseStatus.Error, statusCode: code, message, data: null };
  }

  private fail(key: ApiError, error: any): ResponseDto {
    this.logger.error(error?.message, error?.stack);
    return this.err(key);
  }
}
