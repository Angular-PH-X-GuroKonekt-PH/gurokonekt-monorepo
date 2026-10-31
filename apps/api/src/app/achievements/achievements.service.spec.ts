import {
  AchievementAwardType,
  AchievementMetric,
  API_RESPONSE,
  LogsActionType,
  MentorAchievementStatus,
  ResponseStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import { AchievementMetricsService, MentorMetrics } from './achievement-metrics.service';
import { AchievementsService, Actor } from './achievements.service';

const ACTOR: Actor = { id: 'mentor-1', ipAddress: '127.0.0.1', userAgent: 'jest' };
const ADMIN: Actor = { id: 'admin-1', ipAddress: '127.0.0.1', userAgent: 'jest' };

const metrics = (overrides: Partial<MentorMetrics> = {}): MentorMetrics => ({
  [AchievementMetric.CompletedSessions]: 0,
  [AchievementMetric.AverageRating]: 0,
  [AchievementMetric.ReviewCount]: 0,
  [AchievementMetric.YearsOfExperience]: 0,
  ...overrides,
});

const achievementRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'ach-1',
  name: 'Microsoft MVP',
  description: 'Recognised by Microsoft',
  icon: '🏆',
  color: 'blue',
  awardType: AchievementAwardType.Application,
  requirements: 'Upload your MVP certificate',
  requiresProof: true,
  autoApprove: false,
  criteria: [],
  validityMonths: 12,
  isActive: true,
  createdAt: new Date('2026-10-01'),
  updatedAt: new Date('2026-10-01'),
  ...overrides,
});

const recordRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'rec-1',
  achievementId: 'ach-1',
  mentorId: 'mentor-1',
  status: MentorAchievementStatus.Pending,
  details: null,
  earnedAt: null,
  awardedAt: null,
  expiresAt: null,
  proofPath: null,
  proofFileName: null,
  proofFileType: null,
  proofFileSize: null,
  reviewNote: null,
  reviewedAt: null,
  updatedAt: new Date('2026-10-01'),
  ...overrides,
});

const file = { originalname: 'mvp.pdf', mimetype: 'application/pdf', size: 1000, buffer: Buffer.from('x') } as Express.Multer.File;

describe('AchievementsService', () => {
  const db = {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    achievement: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    mentorAchievement: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    logs: { create: jest.fn() },
  };
  const storage = {
    uploadAchievementProof: jest.fn(),
    removeAchievementProof: jest.fn(),
    getAchievementProofUrl: jest.fn(),
  };
  const mail = { sendAchievementApprovedEmail: jest.fn(), sendAchievementDeclinedEmail: jest.fn() };
  const metricsService = { getMetrics: jest.fn() };
  const service = new AchievementsService(
    { db } as unknown as PrismaService,
    storage as unknown as StorageService,
    mail as unknown as MailService,
    metricsService as unknown as AchievementMetricsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    db.user.findUnique.mockResolvedValue({ role: 'mentor', status: 'approved', isMentorApproved: true });
    db.achievement.findUnique.mockResolvedValue(achievementRow());
    db.mentorAchievement.findUnique.mockResolvedValue(null);
    db.mentorAchievement.create.mockImplementation(async ({ data }) => recordRow(data));
    db.mentorAchievement.update.mockImplementation(async ({ data }) => recordRow(data));
    storage.uploadAchievementProof.mockResolvedValue('mentor-1/new.pdf');
  });

  describe('mentor applications', () => {
    it('only lets approved mentors apply', async () => {
      db.user.findUnique.mockResolvedValue({ role: 'mentee', status: 'active', isMentorApproved: false });

      const res = await service.submitApplication('mentor-1', 'ach-1', {}, file, ACTOR);

      expect(res.statusCode).toBe(API_RESPONSE.ERROR.ACHIEVEMENT_NOT_MENTOR.code);
      expect(storage.uploadAchievementProof).not.toHaveBeenCalled();
    });

    it('refuses applications for automatic achievements', async () => {
      db.achievement.findUnique.mockResolvedValue(achievementRow({ awardType: AchievementAwardType.Automatic }));

      const res = await service.submitApplication('mentor-1', 'ach-1', {}, file, ACTOR);

      expect(res.statusCode).toBe(API_RESPONSE.ERROR.ACHIEVEMENT_NOT_APPLICATION.code);
    });

    it('requires proof when the achievement asks for it', async () => {
      const res = await service.submitApplication('mentor-1', 'ach-1', {}, undefined, ACTOR);

      expect(res.statusCode).toBe(API_RESPONSE.ERROR.ACHIEVEMENT_PROOF_REQUIRED.code);
    });

    it('waits for an admin when auto-approve is off', async () => {
      const res = await service.submitApplication('mentor-1', 'ach-1', { details: 'Developer Technologies' }, file, ACTOR);

      expect(res.status).toBe(ResponseStatus.Success);
      expect(res.statusCode).toBe(API_RESPONSE.SUCCESS.ACHIEVEMENT_APPLY.code);
      expect(db.mentorAchievement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: MentorAchievementStatus.Pending, awardedAt: null, proofPath: 'mentor-1/new.pdf' }),
      });
      expect(db.logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actionType: LogsActionType.MentorApplyAchievement }),
      });
    });

    it('grants the badge straight away when auto-approve is on, expiring after the validity period', async () => {
      db.achievement.findUnique.mockResolvedValue(achievementRow({ autoApprove: true, validityMonths: 12 }));

      const res = await service.submitApplication('mentor-1', 'ach-1', {}, file, ACTOR);

      expect(res.message).toBe(API_RESPONSE.SUCCESS.ACHIEVEMENT_AUTO_APPROVED.message);
      const data = db.mentorAchievement.create.mock.calls[0][0].data;
      expect(data.status).toBe(MentorAchievementStatus.Approved);
      const months =
        (data.expiresAt.getFullYear() - data.awardedAt.getFullYear()) * 12 + data.expiresAt.getMonth() - data.awardedAt.getMonth();
      expect(months).toBe(12);
    });

    it('never lets auto-approve bring back a badge an admin revoked', async () => {
      db.achievement.findUnique.mockResolvedValue(achievementRow({ autoApprove: true }));
      db.mentorAchievement.findUnique.mockResolvedValue(recordRow({ status: MentorAchievementStatus.Revoked }));

      await service.submitApplication('mentor-1', 'ach-1', {}, file, ACTOR);

      expect(db.mentorAchievement.update.mock.calls[0][0].data.status).toBe(MentorAchievementStatus.Pending);
    });

    it('sends an edited approved badge back for review and replaces the old proof', async () => {
      db.mentorAchievement.findUnique.mockResolvedValue(
        recordRow({ status: MentorAchievementStatus.Approved, proofPath: 'mentor-1/old.pdf', awardedAt: new Date() }),
      );

      await service.submitApplication('mentor-1', 'ach-1', { details: 'Updated' }, file, ACTOR);

      expect(db.mentorAchievement.update.mock.calls[0][0].data).toEqual(
        expect.objectContaining({ status: MentorAchievementStatus.Pending, awardedAt: null, reviewNote: null }),
      );
      expect(storage.removeAchievementProof).toHaveBeenCalledWith('mentor-1/old.pdf');
    });

    it('keeps the proof on file when editing without a new upload', async () => {
      db.mentorAchievement.findUnique.mockResolvedValue(recordRow({ proofPath: 'mentor-1/old.pdf' }));

      const res = await service.submitApplication('mentor-1', 'ach-1', { keepProof: true }, undefined, ACTOR);

      expect(res.status).toBe(ResponseStatus.Success);
      expect(db.mentorAchievement.update.mock.calls[0][0].data).not.toHaveProperty('proofPath');
      expect(storage.removeAchievementProof).not.toHaveBeenCalled();
    });

    it('rejects an expiry date in the past', async () => {
      const res = await service.submitApplication('mentor-1', 'ach-1', { expiresAt: '2020-01-01' }, file, ACTOR);

      expect(res.statusCode).toBe(API_RESPONSE.ERROR.ACHIEVEMENT_INVALID_DATES.code);
      expect(storage.uploadAchievementProof).not.toHaveBeenCalled();
    });

    it('removes the uploaded file if saving the application fails', async () => {
      db.mentorAchievement.create.mockRejectedValue(new Error('db down'));

      const res = await service.submitApplication('mentor-1', 'ach-1', {}, file, ACTOR);

      expect(res.status).toBe(ResponseStatus.Error);
      expect(storage.removeAchievementProof).toHaveBeenCalledWith('mentor-1/new.pdf');
    });
  });

  describe('admin review', () => {
    const pending = recordRow({
      achievement: { name: 'Microsoft MVP', validityMonths: null },
      mentor: { email: 'maria@example.com', firstName: 'Maria' },
    });

    it('approves a pending application and emails the mentor', async () => {
      db.mentorAchievement.findUnique.mockResolvedValue(pending);
      db.mentorAchievement.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.approve('rec-1', ADMIN);

      expect(res.status).toBe(ResponseStatus.Success);
      expect(db.mentorAchievement.updateMany).toHaveBeenCalledWith({
        where: { id: 'rec-1', status: { in: [MentorAchievementStatus.Pending] } },
        data: expect.objectContaining({ status: MentorAchievementStatus.Approved, reviewedById: 'admin-1', expiresAt: null }),
      });
      expect(mail.sendAchievementApprovedEmail).toHaveBeenCalledWith('maria@example.com', 'Maria', 'Microsoft MVP');
    });

    it('keeps the expiry date the mentor entered when approving', async () => {
      const expiresAt = new Date('2027-06-30');
      db.mentorAchievement.findUnique.mockResolvedValue({ ...pending, expiresAt });
      db.mentorAchievement.updateMany.mockResolvedValue({ count: 1 });

      await service.approve('rec-1', ADMIN);

      expect(db.mentorAchievement.updateMany.mock.calls[0][0].data.expiresAt).toBe(expiresAt);
    });

    it('rejects with a reason and tells the mentor', async () => {
      db.mentorAchievement.findUnique.mockResolvedValue(pending);
      db.mentorAchievement.updateMany.mockResolvedValue({ count: 1 });

      await service.reject('rec-1', { reason: ' Certificate is unreadable ' }, ADMIN);

      expect(db.mentorAchievement.updateMany.mock.calls[0][0].data).toEqual(
        expect.objectContaining({ status: MentorAchievementStatus.Rejected, reviewNote: 'Certificate is unreadable' }),
      );
      expect(mail.sendAchievementDeclinedEmail).toHaveBeenCalledWith(
        'maria@example.com', 'Maria', 'Microsoft MVP', 'Certificate is unreadable', false,
      );
    });

    it('can only revoke a granted badge', async () => {
      db.mentorAchievement.findUnique.mockResolvedValue(pending);

      const res = await service.revoke('rec-1', { reason: 'x' }, ADMIN);

      expect(res.statusCode).toBe(API_RESPONSE.ERROR.ACHIEVEMENT_INVALID_STATUS.code);
      expect(db.mentorAchievement.updateMany).not.toHaveBeenCalled();
    });

    it('does nothing if another admin already reviewed it', async () => {
      db.mentorAchievement.findUnique.mockResolvedValue(pending);
      db.mentorAchievement.updateMany.mockResolvedValue({ count: 0 });

      const res = await service.approve('rec-1', ADMIN);

      expect(res.statusCode).toBe(API_RESPONSE.ERROR.ACHIEVEMENT_INVALID_STATUS.code);
      expect(mail.sendAchievementApprovedEmail).not.toHaveBeenCalled();
    });
  });

  describe('catalog', () => {
    it('needs at least one criterion for an automatic achievement', async () => {
      const res = await service.createAchievement(
        { name: '50 Sessions', description: 'x', icon: '🏆', color: 'amber', awardType: AchievementAwardType.Automatic, criteria: [] },
        ADMIN,
      );

      expect(res.statusCode).toBe(API_RESPONSE.ERROR.ACHIEVEMENT_INVALID_CRITERIA.code);
      expect(db.achievement.create).not.toHaveBeenCalled();
    });

    it('will not delete an achievement mentors already have', async () => {
      db.achievement.findUnique.mockResolvedValue({ id: 'ach-1', name: 'MVP', _count: { mentorAchievements: 3 } });

      const res = await service.deleteAchievement('ach-1', ADMIN);

      expect(res.statusCode).toBe(API_RESPONSE.ERROR.ACHIEVEMENT_IN_USE.code);
      expect(db.achievement.delete).not.toHaveBeenCalled();
    });
  });

  describe('automatic awarding', () => {
    const automatic = achievementRow({
      id: 'auto-1',
      name: '50 Sessions',
      awardType: AchievementAwardType.Automatic,
      requiresProof: false,
      criteria: [{ metric: AchievementMetric.CompletedSessions, min: 50 }],
      validityMonths: null,
    });

    beforeEach(() => {
      db.achievement.findMany.mockResolvedValue([automatic]);
      db.user.findMany.mockResolvedValue([{ id: 'qualifies' }, { id: 'too-few' }, { id: 'already' }, { id: 'expired' }, { id: 'revoked' }]);
      metricsService.getMetrics.mockResolvedValue(
        new Map([
          ['qualifies', metrics({ [AchievementMetric.CompletedSessions]: 60 })],
          ['too-few', metrics({ [AchievementMetric.CompletedSessions]: 10 })],
          ['already', metrics({ [AchievementMetric.CompletedSessions]: 80 })],
          ['expired', metrics({ [AchievementMetric.CompletedSessions]: 55 })],
          ['revoked', metrics({ [AchievementMetric.CompletedSessions]: 99 })],
        ]),
      );
      db.mentorAchievement.findMany.mockResolvedValue([
        { id: 'r-already', mentorId: 'already', achievementId: 'auto-1', status: MentorAchievementStatus.Approved },
        { id: 'r-expired', mentorId: 'expired', achievementId: 'auto-1', status: MentorAchievementStatus.Expired },
        { id: 'r-revoked', mentorId: 'revoked', achievementId: 'auto-1', status: MentorAchievementStatus.Revoked },
      ]);
    });

    it('grants new badges, renews expired ones, and leaves held or revoked ones alone', async () => {
      const awarded = await service.evaluateAutomatic();

      expect(awarded).toBe(2);
      expect(db.mentorAchievement.create).toHaveBeenCalledTimes(1);
      expect(db.mentorAchievement.create.mock.calls[0][0].data).toEqual(
        expect.objectContaining({ mentorId: 'qualifies', status: MentorAchievementStatus.Approved, expiresAt: null }),
      );
      expect(db.mentorAchievement.update).toHaveBeenCalledTimes(1);
      expect(db.mentorAchievement.update.mock.calls[0][0].where).toEqual({ id: 'r-expired' });
      expect(db.logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actionType: LogsActionType.AchievementAutoAwarded, ipAddress: 'system' }),
      });
    });

    it('never throws', async () => {
      db.achievement.findMany.mockRejectedValue(new Error('db down'));

      await expect(service.evaluateAutomatic()).resolves.toBe(0);
    });
  });

  it('expires approved badges past their date', async () => {
    db.mentorAchievement.updateMany.mockResolvedValue({ count: 4 });
    const now = new Date('2026-11-01');

    const count = await service.expireBadges(now);

    expect(count).toBe(4);
    expect(db.mentorAchievement.updateMany).toHaveBeenCalledWith({
      where: { status: MentorAchievementStatus.Approved, expiresAt: { lte: now } },
      data: { status: MentorAchievementStatus.Expired },
    });
  });
});

describe('AchievementMetricsService', () => {
  const db = {
    booking: { groupBy: jest.fn() },
    bookingFeedback: { findMany: jest.fn() },
    mentorProfile: { findMany: jest.fn() },
  };
  const service = new AchievementMetricsService({ db } as unknown as PrismaService);

  it('counts sessions, averages only mentee ratings, and reads years of experience', async () => {
    db.booking.groupBy.mockResolvedValue([{ mentorId: 'm1', _count: { _all: 12 } }]);
    db.bookingFeedback.findMany.mockResolvedValue([
      { rating: 5, userId: 'mentee-a', booking: { mentorId: 'm1', menteeId: 'mentee-a' } },
      { rating: 4, userId: 'mentee-b', booking: { mentorId: 'm1', menteeId: 'mentee-b' } },
      // The mentor's own feedback on the session must not count.
      { rating: 1, userId: 'm1', booking: { mentorId: 'm1', menteeId: 'mentee-a' } },
    ]);
    db.mentorProfile.findMany.mockResolvedValue([{ userId: 'm1', yearsOfExperience: 7 }]);

    const result = (await service.getMetrics(['m1', 'm2'])).get('m1');

    expect(result).toEqual({
      [AchievementMetric.CompletedSessions]: 12,
      [AchievementMetric.AverageRating]: 4.5,
      [AchievementMetric.ReviewCount]: 2,
      [AchievementMetric.YearsOfExperience]: 7,
    });
  });

  it('requires every criterion to be met', () => {
    const m = metrics({ [AchievementMetric.CompletedSessions]: 60, [AchievementMetric.AverageRating]: 4.2 });

    expect(
      AchievementMetricsService.meetsAll(
        [
          { metric: AchievementMetric.CompletedSessions, min: 50 },
          { metric: AchievementMetric.AverageRating, min: 4.5 },
        ],
        m,
      ),
    ).toBe(false);
    expect(AchievementMetricsService.meetsAll([{ metric: AchievementMetric.CompletedSessions, min: 50 }], m)).toBe(true);
    expect(AchievementMetricsService.meetsAll([], m)).toBe(false);
  });
});
