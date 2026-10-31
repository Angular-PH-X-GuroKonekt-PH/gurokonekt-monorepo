import { Injectable, Logger } from '@nestjs/common';
import {
  AchievementAwardType,
  AchievementCriterion,
  AchievementInterface,
  AdminAchievementInterface,
  AdminAchievementSubmissionInterface,
  API_RESPONSE,
  ApplyAchievementDto,
  CreateAchievementDto,
  LogsActionType,
  MentorAccess,
  MentorAchievementCatalogItem,
  MentorAchievementInterface,
  MentorAchievementStatus,
  ResponseDto,
  ResponseStatus,
  ReviewAchievementDto,
  UpdateAchievementDto,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import { AchievementMetricsService } from './achievement-metrics.service';

type ApiError = keyof typeof API_RESPONSE.ERROR;

type AchievementRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  awardType: string;
  requirements: string | null;
  requiresProof: boolean;
  autoApprove: boolean;
  criteria: unknown;
  validityMonths: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type MentorAchievementRow = {
  id: string;
  achievementId: string;
  status: string;
  details: string | null;
  earnedAt: Date | null;
  awardedAt: Date | null;
  expiresAt: Date | null;
  proofPath: string | null;
  proofFileName: string | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  updatedAt: Date;
};

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

const addMonths = (from: Date, months: number): Date => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
};

/** Who did something, for the audit log. */
export interface Actor {
  id: string | null;
  ipAddress: string;
  userAgent: string;
}

/**
 * Mentor achievement badges (issue #419).
 *
 * Admins define achievements. "Automatic" ones are granted by the system when a
 * mentor meets every criterion; "application" ones are applied for by the mentor
 * (with proof if required) and approved by an admin, or instantly if the
 * achievement is set to auto-approve. Only approved, unexpired badges are shown
 * to mentees and count towards search ranking.
 */
@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
    private readonly metrics: AchievementMetricsService,
  ) {}

  // ====================================================
  // MENTOR
  // ====================================================

  /** Active achievements with the mentor's own record and progress. */
  async getMentorCatalog(mentorId: string): Promise<ResponseDto> {
    try {
      const [achievements, mine, metricsMap] = await Promise.all([
        this.prisma.db.achievement.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
        this.prisma.db.mentorAchievement.findMany({ where: { mentorId } }),
        this.metrics.getMetrics([mentorId]),
      ]);
      const mineById = new Map(mine.map((m) => [m.achievementId, m]));
      const mentorMetrics = metricsMap.get(mentorId)!;

      const data: MentorAchievementCatalogItem[] = achievements.map((a) => {
        const achievement = this.toAchievement(a);
        const record = mineById.get(a.id);
        return {
          achievement,
          mine: record ? this.toMentorAchievement(record) : null,
          progress:
            achievement.awardType === AchievementAwardType.Automatic
              ? achievement.criteria.map((c) => ({
                  metric: c.metric,
                  min: c.min,
                  current: mentorMetrics[c.metric] ?? 0,
                  met: (mentorMetrics[c.metric] ?? 0) >= c.min,
                }))
              : [],
        };
      });

      return this.ok('ACHIEVEMENTS_LIST', data);
    } catch (error) {
      return this.fail('ACHIEVEMENTS_LIST', error);
    }
  }

  /**
   * Creates or updates the mentor's application for one achievement. Any change
   * to an approved badge sends it back for review (unless auto-approve is on).
   */
  async submitApplication(
    mentorId: string,
    achievementId: string,
    dto: ApplyAchievementDto,
    file: Express.Multer.File | undefined,
    actor: Actor,
  ): Promise<ResponseDto> {
    let uploadedPath: string | null = null;
    try {
      const mentor = await this.prisma.db.user.findUnique({
        where: { id: mentorId },
        select: { role: true, status: true, isMentorApproved: true },
      });
      if (!mentor || mentor.role !== UserRole.Mentor || mentor.status !== UserStatus.Approved || !mentor.isMentorApproved) {
        return this.err('ACHIEVEMENT_NOT_MENTOR');
      }

      const achievement = await this.prisma.db.achievement.findUnique({ where: { id: achievementId } });
      if (!achievement) return this.err('ACHIEVEMENT_NOT_FOUND');
      if (!achievement.isActive) return this.err('ACHIEVEMENT_INACTIVE');
      if (achievement.awardType !== AchievementAwardType.Application) return this.err('ACHIEVEMENT_NOT_APPLICATION');

      const earnedAt = dto.earnedAt ? new Date(dto.earnedAt) : null;
      const givenExpiry = dto.expiresAt ? new Date(dto.expiresAt) : null;
      if (givenExpiry && (givenExpiry <= new Date() || (earnedAt && givenExpiry <= earnedAt))) {
        return this.err('ACHIEVEMENT_INVALID_DATES');
      }

      const existing = await this.prisma.db.mentorAchievement.findUnique({
        where: { mentorId_achievementId: { mentorId, achievementId } },
      });
      const keepOldProof = !file && !!dto.keepProof && !!existing?.proofPath;
      if (achievement.requiresProof && !file && !keepOldProof) {
        return this.err('ACHIEVEMENT_PROOF_REQUIRED');
      }

      if (file) {
        uploadedPath = await this.storage.uploadAchievementProof(file, mentorId);
      }

      // An admin revoked this badge before: never let auto-approve bring it back.
      const instant = achievement.autoApprove && existing?.status !== MentorAchievementStatus.Revoked;
      const now = new Date();
      const proofFields = file
        ? { proofPath: uploadedPath, proofFileName: file.originalname, proofFileType: file.mimetype, proofFileSize: file.size }
        : keepOldProof
          ? {}
          : { proofPath: null, proofFileName: null, proofFileType: null, proofFileSize: null };
      const fields = {
        details: dto.details?.trim() || null,
        earnedAt,
        status: instant ? MentorAchievementStatus.Approved : MentorAchievementStatus.Pending,
        awardedAt: instant ? now : null,
        expiresAt: instant ? this.expiryFor(now, givenExpiry, achievement.validityMonths) : givenExpiry,
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
        ...proofFields,
      };

      const record = existing
        ? await this.prisma.db.mentorAchievement.update({ where: { id: existing.id }, data: fields })
        : await this.prisma.db.mentorAchievement.create({ data: { mentorId, achievementId, ...fields } });

      // Decide from what was sent, not from the returned row: the old file goes
      // only when it was replaced by a new upload or explicitly dropped.
      const proofNowOnFile = file ? uploadedPath : keepOldProof ? existing!.proofPath : null;
      if (existing?.proofPath && existing.proofPath !== proofNowOnFile) {
        await this.storage.removeAchievementProof(existing.proofPath);
      }

      await this.log(LogsActionType.MentorApplyAchievement, record.id, actor, {
        achievementId,
        status: record.status,
        resubmitted: !!existing,
      });

      const result = this.ok(instant ? 'ACHIEVEMENT_AUTO_APPROVED' : 'ACHIEVEMENT_APPLY', this.toMentorAchievement(record));
      uploadedPath = null;
      return result;
    } catch (error) {
      // Don't leave an orphaned file behind if saving the application failed.
      await this.storage.removeAchievementProof(uploadedPath);
      return this.fail('ACHIEVEMENT_APPLY', error);
    }
  }

  /** The mentor removes their own application or badge (application type only). */
  async withdrawApplication(mentorId: string, achievementId: string, actor: Actor): Promise<ResponseDto> {
    try {
      const record = await this.prisma.db.mentorAchievement.findUnique({
        where: { mentorId_achievementId: { mentorId, achievementId } },
        include: { achievement: { select: { awardType: true } } },
      });
      if (!record) return this.err('ACHIEVEMENT_SUBMISSION_NOT_FOUND');
      if (record.achievement.awardType !== AchievementAwardType.Application) {
        return this.err('ACHIEVEMENT_NOT_APPLICATION');
      }

      await this.prisma.db.mentorAchievement.delete({ where: { id: record.id } });
      await this.storage.removeAchievementProof(record.proofPath);
      await this.log(LogsActionType.MentorApplyAchievement, record.id, actor, { achievementId, withdrawn: true });

      return this.ok('ACHIEVEMENT_WITHDRAW', null);
    } catch (error) {
      return this.fail('ACHIEVEMENT_WITHDRAW', error);
    }
  }

  // ====================================================
  // ADMIN – CATALOG
  // ====================================================

  async listAchievements(): Promise<ResponseDto> {
    try {
      const now = new Date();
      const [achievements, holders, pending] = await Promise.all([
        this.prisma.db.achievement.findMany({ orderBy: { createdAt: 'asc' } }),
        this.prisma.db.mentorAchievement.groupBy({
          by: ['achievementId'],
          where: { status: MentorAchievementStatus.Approved, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          _count: { _all: true },
        }),
        this.prisma.db.mentorAchievement.groupBy({
          by: ['achievementId'],
          where: { status: MentorAchievementStatus.Pending },
          _count: { _all: true },
        }),
      ]);
      const holderCount = new Map(holders.map((h) => [h.achievementId, h._count._all]));
      const pendingCount = new Map(pending.map((p) => [p.achievementId, p._count._all]));

      const data: AdminAchievementInterface[] = achievements.map((a) => ({
        ...this.toAchievement(a),
        holderCount: holderCount.get(a.id) ?? 0,
        pendingCount: pendingCount.get(a.id) ?? 0,
      }));
      return this.ok('ACHIEVEMENTS_LIST', data);
    } catch (error) {
      return this.fail('ACHIEVEMENTS_LIST', error);
    }
  }

  async createAchievement(dto: CreateAchievementDto, actor: Actor): Promise<ResponseDto> {
    try {
      const automatic = dto.awardType === AchievementAwardType.Automatic;
      if (automatic && !dto.criteria?.length) return this.err('ACHIEVEMENT_INVALID_CRITERIA');

      const created = await this.prisma.db.achievement.create({
        data: {
          name: dto.name.trim(),
          description: dto.description.trim(),
          icon: dto.icon,
          color: dto.color,
          awardType: dto.awardType,
          requirements: automatic ? null : dto.requirements?.trim() || null,
          requiresProof: automatic ? false : (dto.requiresProof ?? true),
          autoApprove: automatic ? false : (dto.autoApprove ?? false),
          criteria: automatic ? this.cleanCriteria(dto.criteria!) : [],
          validityMonths: dto.validityMonths ?? null,
          isActive: dto.isActive ?? true,
          createdById: actor.id,
        },
      });
      await this.log(LogsActionType.AdminCreateAchievement, created.id, actor, { name: created.name });

      // Give it straight away to mentors who already qualify.
      const awarded = automatic && created.isActive ? await this.evaluateAutomatic(created.id) : 0;
      return this.ok('ACHIEVEMENT_CREATE', { ...this.toAchievement(created), awarded });
    } catch (error) {
      return this.fail('ACHIEVEMENT_CREATE', error);
    }
  }

  async updateAchievement(id: string, dto: UpdateAchievementDto, actor: Actor): Promise<ResponseDto> {
    try {
      const existing = await this.prisma.db.achievement.findUnique({ where: { id } });
      if (!existing) return this.err('ACHIEVEMENT_NOT_FOUND');
      const automatic = existing.awardType === AchievementAwardType.Automatic;
      if (automatic && dto.criteria && !dto.criteria.length) return this.err('ACHIEVEMENT_INVALID_CRITERIA');

      const updated = await this.prisma.db.achievement.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description?.trim(),
          icon: dto.icon,
          color: dto.color,
          requirements: automatic || dto.requirements === undefined ? undefined : dto.requirements?.trim() || null,
          requiresProof: automatic ? undefined : dto.requiresProof,
          autoApprove: automatic ? undefined : dto.autoApprove,
          criteria: automatic && dto.criteria ? this.cleanCriteria(dto.criteria) : undefined,
          validityMonths: dto.validityMonths === undefined ? undefined : dto.validityMonths,
          isActive: dto.isActive,
        },
      });
      await this.log(LogsActionType.AdminUpdateAchievement, id, actor, { changes: Object.keys(dto) });

      const awarded = automatic && updated.isActive ? await this.evaluateAutomatic(id) : 0;
      return this.ok('ACHIEVEMENT_UPDATE', { ...this.toAchievement(updated), awarded });
    } catch (error) {
      return this.fail('ACHIEVEMENT_UPDATE', error);
    }
  }

  /** Only never-used achievements can be deleted; others should be deactivated. */
  async deleteAchievement(id: string, actor: Actor): Promise<ResponseDto> {
    try {
      const existing = await this.prisma.db.achievement.findUnique({
        where: { id },
        select: { id: true, name: true, _count: { select: { mentorAchievements: true } } },
      });
      if (!existing) return this.err('ACHIEVEMENT_NOT_FOUND');
      if (existing._count.mentorAchievements > 0) return this.err('ACHIEVEMENT_IN_USE');

      await this.prisma.db.achievement.delete({ where: { id } });
      await this.log(LogsActionType.AdminDeleteAchievement, id, actor, { name: existing.name });
      return this.ok('ACHIEVEMENT_DELETE', null);
    } catch (error) {
      return this.fail('ACHIEVEMENT_DELETE', error);
    }
  }

  async evaluateNow(id: string): Promise<ResponseDto> {
    try {
      const achievement = await this.prisma.db.achievement.findUnique({ where: { id }, select: { awardType: true } });
      if (!achievement) return this.err('ACHIEVEMENT_NOT_FOUND');
      if (achievement.awardType !== AchievementAwardType.Automatic) return this.err('ACHIEVEMENT_NOT_AUTOMATIC');
      const awarded = await this.evaluateAutomatic(id);
      return this.ok('ACHIEVEMENT_EVALUATE', { awarded });
    } catch (error) {
      return this.fail('ACHIEVEMENT_EVALUATE', error);
    }
  }

  // ====================================================
  // ADMIN – REVIEW
  // ====================================================

  async listSubmissions(status?: MentorAchievementStatus): Promise<ResponseDto> {
    try {
      const rows = await this.prisma.db.mentorAchievement.findMany({
        where: status ? { status } : undefined,
        include: {
          achievement: { select: { id: true, name: true, icon: true, color: true, awardType: true, requiresProof: true } },
          mentor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        // Oldest pending first, so nothing waits forever.
        orderBy: { updatedAt: status === MentorAchievementStatus.Pending ? 'asc' : 'desc' },
        take: 200,
      });

      const data: AdminAchievementSubmissionInterface[] = rows.map((r) => ({
        ...this.toMentorAchievement(r),
        achievement: {
          id: r.achievement.id,
          name: r.achievement.name,
          icon: r.achievement.icon,
          color: r.achievement.color,
          awardType: r.achievement.awardType as AchievementAwardType,
          requiresProof: r.achievement.requiresProof,
        },
        mentor: r.mentor,
        hasProof: !!r.proofPath,
      }));
      return this.ok('ACHIEVEMENT_SUBMISSIONS', data);
    } catch (error) {
      return this.fail('ACHIEVEMENT_SUBMISSIONS', error);
    }
  }

  async getProofUrl(submissionId: string): Promise<ResponseDto> {
    try {
      const record = await this.prisma.db.mentorAchievement.findUnique({
        where: { id: submissionId },
        select: { proofPath: true },
      });
      if (!record) return this.err('ACHIEVEMENT_SUBMISSION_NOT_FOUND');
      if (!record.proofPath) return this.err('ACHIEVEMENT_NO_PROOF');
      const url = await this.storage.getAchievementProofUrl(record.proofPath);
      return this.ok('ACHIEVEMENT_PROOF_URL', { url, expiresInSeconds: StorageService.PROOF_LINK_TTL_SECONDS });
    } catch (error) {
      return this.fail('ACHIEVEMENT_PROOF_URL', error);
    }
  }

  async approve(submissionId: string, actor: Actor): Promise<ResponseDto> {
    return this.review(submissionId, 'approve', actor);
  }

  async reject(submissionId: string, dto: ReviewAchievementDto, actor: Actor): Promise<ResponseDto> {
    return this.review(submissionId, 'reject', actor, dto.reason.trim());
  }

  async revoke(submissionId: string, dto: ReviewAchievementDto, actor: Actor): Promise<ResponseDto> {
    return this.review(submissionId, 'revoke', actor, dto.reason.trim());
  }

  private async review(
    submissionId: string,
    action: 'approve' | 'reject' | 'revoke',
    actor: Actor,
    reason?: string,
  ): Promise<ResponseDto> {
    const allowedFrom: Record<typeof action, MentorAchievementStatus[]> = {
      approve: [MentorAchievementStatus.Pending],
      reject: [MentorAchievementStatus.Pending],
      revoke: [MentorAchievementStatus.Approved, MentorAchievementStatus.Expired],
    };
    try {
      const record = await this.prisma.db.mentorAchievement.findUnique({
        where: { id: submissionId },
        include: {
          achievement: { select: { name: true, validityMonths: true } },
          mentor: { select: { email: true, firstName: true } },
        },
      });
      if (!record) return this.err('ACHIEVEMENT_SUBMISSION_NOT_FOUND');
      if (!allowedFrom[action].includes(record.status as MentorAchievementStatus)) {
        return this.err('ACHIEVEMENT_INVALID_STATUS');
      }

      const now = new Date();
      const data =
        action === 'approve'
          ? {
              status: MentorAchievementStatus.Approved,
              awardedAt: now,
              // The mentor's own expiry date (if any) is kept; otherwise use the achievement's validity.
              expiresAt: this.expiryFor(now, record.expiresAt, record.achievement.validityMonths),
              reviewNote: null,
            }
          : {
              status: action === 'reject' ? MentorAchievementStatus.Rejected : MentorAchievementStatus.Revoked,
              reviewNote: reason,
            };

      // Re-check the status in the update itself so two admins can't act at once.
      const { count } = await this.prisma.db.mentorAchievement.updateMany({
        where: { id: submissionId, status: { in: allowedFrom[action] } },
        data: { ...data, reviewedById: actor.id, reviewedAt: now },
      });
      if (!count) return this.err('ACHIEVEMENT_INVALID_STATUS');

      const logType = {
        approve: LogsActionType.AdminApproveAchievement,
        reject: LogsActionType.AdminRejectAchievement,
        revoke: LogsActionType.AdminRevokeAchievement,
      }[action];
      await this.log(logType, submissionId, actor, { achievementId: record.achievementId, mentorId: record.mentorId, reason });

      const { email, firstName } = record.mentor;
      const name = record.achievement.name;
      if (action === 'approve') this.mail.sendAchievementApprovedEmail(email, firstName, name);
      else this.mail.sendAchievementDeclinedEmail(email, firstName, name, reason!, action === 'revoke');

      const key = { approve: 'ACHIEVEMENT_APPROVE', reject: 'ACHIEVEMENT_REJECT', revoke: 'ACHIEVEMENT_REVOKE' } as const;
      return this.ok(key[action], null);
    } catch (error) {
      return this.fail('ACHIEVEMENT_REVIEW', error);
    }
  }

  // ====================================================
  // AUTOMATIC AWARDING & EXPIRY (also run daily by AchievementSchedulerService)
  // ====================================================

  /**
   * Grants automatic achievements to every approved, visible mentor who meets
   * all the criteria and doesn't already hold it. An expired automatic badge is
   * renewed; a revoked one is never given back automatically.
   * Returns the number of badges granted. Never throws.
   */
  async evaluateAutomatic(achievementId?: string): Promise<number> {
    try {
      const achievements = await this.prisma.db.achievement.findMany({
        where: { awardType: AchievementAwardType.Automatic, isActive: true, ...(achievementId ? { id: achievementId } : {}) },
      });
      if (!achievements.length) return 0;

      const mentors = await this.prisma.db.user.findMany({
        where: MentorAccess.approvedMentorWhere(),
        select: { id: true },
      });
      const metricsMap = await this.metrics.getMetrics(mentors.map((m) => m.id));
      const existing = await this.prisma.db.mentorAchievement.findMany({
        where: { achievementId: { in: achievements.map((a) => a.id) } },
        select: { id: true, mentorId: true, achievementId: true, status: true },
      });
      const existingByKey = new Map(existing.map((e) => [`${e.mentorId}:${e.achievementId}`, e]));

      let awarded = 0;
      const now = new Date();
      for (const achievement of achievements) {
        const criteria = this.toAchievement(achievement).criteria;
        for (const mentor of mentors) {
          if (!AchievementMetricsService.meetsAll(criteria, metricsMap.get(mentor.id)!)) continue;
          const current = existingByKey.get(`${mentor.id}:${achievement.id}`);
          if (current && current.status !== MentorAchievementStatus.Expired) continue;

          const fields = {
            status: MentorAchievementStatus.Approved,
            awardedAt: now,
            expiresAt: this.expiryFor(now, null, achievement.validityMonths),
          };
          const record = current
            ? await this.prisma.db.mentorAchievement.update({ where: { id: current.id }, data: fields })
            : await this.prisma.db.mentorAchievement.create({
                data: { mentorId: mentor.id, achievementId: achievement.id, ...fields },
              });
          awarded++;
          await this.log(LogsActionType.AchievementAutoAwarded, record.id, { id: null, ipAddress: 'system', userAgent: 'achievements' }, {
            achievementId: achievement.id,
            mentorId: mentor.id,
          });
        }
      }

      if (awarded) this.logger.log(`Automatically granted ${awarded} achievement badge(s)`);
      return awarded;
    } catch (error: any) {
      this.logger.error(`Automatic achievement check failed: ${error?.message}`, error?.stack);
      return 0;
    }
  }

  /** Marks approved badges past their expiry date as expired. Never throws. */
  async expireBadges(now: Date = new Date()): Promise<number> {
    try {
      const { count } = await this.prisma.db.mentorAchievement.updateMany({
        where: { status: MentorAchievementStatus.Approved, expiresAt: { lte: now } },
        data: { status: MentorAchievementStatus.Expired },
      });
      if (count) this.logger.log(`Marked ${count} achievement badge(s) as expired`);
      return count;
    } catch (error: any) {
      this.logger.error(`Badge expiry check failed: ${error?.message}`, error?.stack);
      return 0;
    }
  }

  // ====================================================
  // HELPERS
  // ====================================================

  /** A given date wins; otherwise the achievement's validity period; otherwise never. */
  private expiryFor(from: Date, given: Date | null, validityMonths: number | null): Date | null {
    if (given) return given;
    return validityMonths ? addMonths(from, validityMonths) : null;
  }

  /** Plain object type (not the interface) so Prisma accepts it as JSON. */
  private cleanCriteria(criteria: AchievementCriterion[]): { metric: string; min: number }[] {
    return criteria.map((c) => ({ metric: c.metric, min: Number(c.min) }));
  }

  private toAchievement(a: AchievementRow): AchievementInterface {
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      color: a.color,
      awardType: a.awardType as AchievementAwardType,
      requirements: a.requirements,
      requiresProof: a.requiresProof,
      autoApprove: a.autoApprove,
      criteria: Array.isArray(a.criteria) ? (a.criteria as AchievementCriterion[]) : [],
      validityMonths: a.validityMonths,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  private toMentorAchievement(r: MentorAchievementRow): MentorAchievementInterface {
    return {
      id: r.id,
      achievementId: r.achievementId,
      status: r.status as MentorAchievementStatus,
      details: r.details,
      earnedAt: iso(r.earnedAt),
      awardedAt: iso(r.awardedAt),
      expiresAt: iso(r.expiresAt),
      proofFileName: r.proofFileName,
      reviewNote: r.reviewNote,
      reviewedAt: iso(r.reviewedAt),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  private async log(actionType: LogsActionType, targetId: string, actor: Actor, metadata: Record<string, unknown>) {
    await this.prisma.db.logs.create({
      data: {
        actionType,
        targetId,
        details: actionType,
        metadata: metadata as object,
        ipAddress: actor.ipAddress ?? '',
        userAgent: actor.userAgent ?? '',
        createdById: actor.id,
      },
    });
  }

  private ok(key: keyof typeof API_RESPONSE.SUCCESS, data: unknown): ResponseDto {
    return {
      status: ResponseStatus.Success,
      statusCode: API_RESPONSE.SUCCESS[key].code,
      message: API_RESPONSE.SUCCESS[key].message,
      data,
    };
  }

  private err(key: ApiError): ResponseDto {
    return {
      status: ResponseStatus.Error,
      statusCode: API_RESPONSE.ERROR[key].code,
      message: API_RESPONSE.ERROR[key].message,
      data: null,
    };
  }

  private fail(key: ApiError, error: unknown): ResponseDto {
    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.error(err.message, err.stack);
    return this.err(key);
  }
}
