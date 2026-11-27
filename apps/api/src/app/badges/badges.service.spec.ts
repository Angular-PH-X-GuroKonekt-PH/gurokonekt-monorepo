import { Test, TestingModule } from '@nestjs/testing';
import {
  API_RESPONSE,
  BADGE_DEFINITIONS,
  BadgeCategory,
  BadgeRarity,
  BadgeRequirementType,
  LogsActionType,
  ResponseStatus,
  SUPPORTED_BADGE_REQUIREMENTS,
  UserAchievementsInterface,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { BadgesService, longestWeeklyStreak } from './badges.service';

const USER_ID = 'user-1';
const ADMIN = { id: 'admin-1', ipAddress: '127.0.0.1', userAgent: 'jest' };

const badge = (overrides: Record<string, unknown> = {}) => ({
  id: 'badge-1',
  code: 'MENTOR_HELPING_HAND',
  name: 'Helping Hand',
  description: 'Complete 5 mentorship sessions',
  category: BadgeCategory.Mentor,
  rarity: BadgeRarity.Uncommon,
  requirementType: BadgeRequirementType.MentorCompletedSessions,
  requirementValue: 5,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'ub-1',
  userId: USER_ID,
  badgeId: 'badge-1',
  progress: 0,
  target: 5,
  unlocked: false,
  unlockedAt: null,
  featured: false,
  ...overrides,
});

const sessions = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    menteeId: `mentee-${i % 2}`,
    mentorId: `mentor-${i % 3}`,
    sessionDateTime: new Date(Date.UTC(2026, 0, 5 + i * 7)), // one per week
    feedback: i < 2 ? [{ id: `f${i}` }] : [],
  }));

describe('longestWeeklyStreak', () => {
  it('counts consecutive Monday–Sunday weeks and ignores repeats within a week', () => {
    const d = (day: number) => new Date(Date.UTC(2026, 0, day));
    // Jan 5 2026 is a Monday. Weeks: 5–11, 12–18, 19–25, then gap, Feb 2–8.
    expect(longestWeeklyStreak([d(5), d(11), d(12), d(19), d(2 + 31)])).toBe(3);
    expect(longestWeeklyStreak([d(11), d(12)])).toBe(2); // Sunday then Monday
    expect(longestWeeklyStreak([])).toBe(0);
  });
});

describe('BADGE_DEFINITIONS', () => {
  it('has 15 mentor, 15 mentee and 6 special badges with unique codes', () => {
    const count = (c: BadgeCategory) => BADGE_DEFINITIONS.filter((b) => b.category === c).length;
    expect(count(BadgeCategory.Mentor)).toBe(15);
    expect(count(BadgeCategory.Mentee)).toBe(15);
    expect(count(BadgeCategory.Special)).toBe(6);
    expect(new Set(BADGE_DEFINITIONS.map((b) => b.code)).size).toBe(BADGE_DEFINITIONS.length);
  });

  it('only enables badges whose requirement can be tracked', () => {
    for (const b of BADGE_DEFINITIONS) {
      const tracked =
        b.requirementType === BadgeRequirementType.Manual || SUPPORTED_BADGE_REQUIREMENTS.includes(b.requirementType);
      expect(b.active).toBe(tracked);
    }
  });
});

describe('BadgesService', () => {
  let service: BadgesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      db: {
        badge: { createMany: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
        userBadge: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
          updateMany: jest.fn(),
          count: jest.fn(),
        },
        booking: { findMany: jest.fn().mockResolvedValue([]) },
        bookingFeedback: { count: jest.fn().mockResolvedValue(0) },
        user: { findUnique: jest.fn() },
        logs: { create: jest.fn() },
        $transaction: jest.fn((arg) => (typeof arg === 'function' ? arg(prisma.db) : Promise.all(arg))),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BadgesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(BadgesService);
  });

  describe('seedBadges', () => {
    it('inserts definitions without overwriting existing ones', async () => {
      prisma.db.badge.createMany.mockResolvedValue({ count: 0 });
      await service.seedBadges();
      expect(prisma.db.badge.createMany).toHaveBeenCalledWith({ data: BADGE_DEFINITIONS, skipDuplicates: true });
    });
  });

  describe('getMetrics', () => {
    it('counts completed, non-deleted sessions for both roles', async () => {
      prisma.db.booking.findMany
        .mockResolvedValueOnce(sessions(4)) // as mentor
        .mockResolvedValueOnce(sessions(3)); // as mentee
      prisma.db.bookingFeedback.count.mockResolvedValue(2);

      const m = await service.getMetrics(USER_ID);

      expect(prisma.db.booking.findMany.mock.calls[0][0].where).toEqual({
        mentorId: USER_ID,
        status: 'COMPLETED',
        isDeleted: false,
      });
      expect(m).toEqual({
        [BadgeRequirementType.MentorCompletedSessions]: 4,
        [BadgeRequirementType.MentorUniqueMentees]: 2,
        [BadgeRequirementType.MentorConsecutiveWeeks]: 4,
        [BadgeRequirementType.MentorFiveStarReviews]: 2,
        [BadgeRequirementType.MenteeCompletedSessions]: 3,
        [BadgeRequirementType.MenteeUniqueMentors]: 3,
        [BadgeRequirementType.MenteeConsecutiveWeeks]: 3,
        [BadgeRequirementType.MenteeReviewedSessions]: 2,
      });
    });
  });

  describe('evaluateUser', () => {
    const withSessions = (n: number) => prisma.db.booking.findMany.mockResolvedValueOnce(sessions(n)).mockResolvedValueOnce([]);

    it('stores progress for a badge not reached yet', async () => {
      prisma.db.badge.findMany.mockResolvedValue([badge()]);
      withSessions(3);

      await service.evaluateUser(USER_ID);

      expect(prisma.db.userBadge.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, badgeId: 'badge-1', progress: 3, target: 5 },
      });
    });

    it('unlocks with a date and caps progress at the target', async () => {
      prisma.db.badge.findMany.mockResolvedValue([badge()]);
      prisma.db.userBadge.findMany.mockResolvedValue([row({ progress: 4 })]);
      withSessions(7);

      await service.evaluateUser(USER_ID);

      expect(prisma.db.userBadge.updateMany).toHaveBeenCalledWith({
        where: { id: 'ub-1', unlocked: false },
        data: { progress: 5, target: 5, unlocked: true, unlockedAt: expect.any(Date) },
      });
    });

    it('never touches an unlocked badge, and skips unchanged or empty progress', async () => {
      prisma.db.badge.findMany.mockResolvedValue([
        badge(),
        badge({ id: 'badge-2', requirementValue: 10 }),
        badge({ id: 'badge-3', requirementType: BadgeRequirementType.MentorFiveStarReviews }),
      ]);
      prisma.db.userBadge.findMany.mockResolvedValue([
        row({ unlocked: true, progress: 5 }),
        row({ id: 'ub-2', badgeId: 'badge-2', progress: 3, target: 10 }),
      ]);
      withSessions(3); // badge-2 stays at 3; no five-star reviews for badge-3

      await service.evaluateUser(USER_ID);

      expect(prisma.db.userBadge.updateMany).not.toHaveBeenCalled();
      expect(prisma.db.userBadge.create).not.toHaveBeenCalled();
    });

    it('treats a concurrent duplicate create as already done', async () => {
      prisma.db.badge.findMany.mockResolvedValue([badge()]);
      prisma.db.userBadge.create.mockRejectedValue({ code: 'P2002' });
      withSessions(1);

      await expect(service.evaluateUser(USER_ID)).resolves.toBeUndefined();
    });

    it('only evaluates active, non-special, trackable badges', async () => {
      prisma.db.badge.findMany.mockResolvedValue([]);
      await service.evaluateUser(USER_ID);
      expect(prisma.db.badge.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          category: { not: BadgeCategory.Special },
          requirementType: { in: SUPPORTED_BADGE_REQUIREMENTS },
        },
      });
    });
  });

  describe('getUserAchievements', () => {
    it('shows role badges, unlocked history and awarded specials only', async () => {
      prisma.db.user.findUnique.mockResolvedValue({ role: 'mentor' });
      prisma.db.badge.findMany.mockResolvedValue([
        badge(), // mentor, locked -> shown
        badge({ id: 'mentee-1', category: BadgeCategory.Mentee }), // mentee, no row -> hidden
        badge({ id: 'mentee-2', category: BadgeCategory.Mentee }), // mentee with progress -> shown
        badge({ id: 'special-1', category: BadgeCategory.Special }), // not awarded -> hidden
        badge({ id: 'special-2', category: BadgeCategory.Special }), // awarded -> shown
        badge({ id: 'old', active: false }), // disabled but unlocked -> shown
        badge({ id: 'off', active: false }), // disabled, locked -> hidden
      ]);
      const unlockedAt = new Date('2026-09-27');
      prisma.db.userBadge.findMany.mockResolvedValue([
        row({ id: 'a', badgeId: 'mentee-2', progress: 1 }),
        row({ id: 'b', badgeId: 'special-2', unlocked: true, unlockedAt, progress: 1, target: 1, featured: true }),
        row({ id: 'c', badgeId: 'old', unlocked: true, unlockedAt, progress: 5 }),
      ]);

      const res = await service.getUserAchievements(USER_ID);
      const data = res.data as UserAchievementsInterface;

      expect(data.badges.map((b) => b.badgeId)).toEqual(['badge-1', 'mentee-2', 'special-2', 'old']);
      expect(data.unlockedCount).toBe(2);
      expect(data.totalCount).toBe(4);
      expect(data.featured.map((b) => b.badgeId)).toEqual(['special-2']);
      expect(data.badges[0]).toMatchObject({ progress: 0, target: 5, unlocked: false, unlockedAt: null });
    });
  });

  describe('setFeatured', () => {
    it('rejects a badge the user has not unlocked', async () => {
      prisma.db.userBadge.count.mockResolvedValue(1);
      const res = await service.setFeatured(USER_ID, { badgeIds: ['badge-1', 'badge-2'] });
      expect(res.statusCode).toBe(API_RESPONSE.ERROR.BADGE_NOT_UNLOCKED.code);
      expect(prisma.db.$transaction).not.toHaveBeenCalled();
    });

    it('replaces the selection without removing the achievements', async () => {
      prisma.db.userBadge.count.mockResolvedValue(2);
      prisma.db.user.findUnique.mockResolvedValue({ role: 'mentor' });
      prisma.db.badge.findMany.mockResolvedValue([]);

      const res = await service.setFeatured(USER_ID, { badgeIds: ['badge-1', 'badge-2'] });

      expect(res.status).toBe(ResponseStatus.Success);
      expect(prisma.db.userBadge.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, featured: true, badgeId: { notIn: ['badge-1', 'badge-2'] } },
        data: { featured: false },
      });
      expect(prisma.db.userBadge.updateMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, badgeId: { in: ['badge-1', 'badge-2'] }, unlocked: true },
        data: { featured: true },
      });
    });
  });

  describe('updateBadge', () => {
    it('refuses to enable a badge whose requirement cannot be tracked', async () => {
      prisma.db.badge.findUnique.mockResolvedValue(
        badge({ active: false, requirementType: BadgeRequirementType.MenteeCompletedCourses }),
      );
      const res = await service.updateBadge('badge-1', { active: true }, ADMIN);
      expect(res.statusCode).toBe(API_RESPONSE.ERROR.BADGE_REQUIREMENT_UNSUPPORTED.code);
      expect(prisma.db.badge.update).not.toHaveBeenCalled();
    });

    it('updates rarity and logs the change', async () => {
      prisma.db.badge.findUnique.mockResolvedValue(badge());
      prisma.db.badge.update.mockResolvedValue(badge({ rarity: BadgeRarity.Rare }));

      const res = await service.updateBadge('badge-1', { rarity: BadgeRarity.Rare }, ADMIN);

      expect(res.status).toBe(ResponseStatus.Success);
      expect(prisma.db.logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actionType: LogsActionType.AdminUpdateBadge, createdById: ADMIN.id }),
      });
    });
  });

  describe('awardSpecialBadge', () => {
    const special = badge({ id: 'special-1', category: BadgeCategory.Special, requirementType: 'manual', requirementValue: 1 });

    it('awards once with a date, the admin and an audit log', async () => {
      prisma.db.badge.findUnique.mockResolvedValue(special);
      prisma.db.user.findUnique.mockResolvedValue({ id: USER_ID });
      prisma.db.userBadge.create.mockResolvedValue(row({ id: 'ub-9' }));

      const res = await service.awardSpecialBadge('special-1', { userId: USER_ID }, ADMIN);

      expect(res.statusCode).toBe(API_RESPONSE.SUCCESS.ADMIN_AWARD_BADGE.code);
      expect(prisma.db.userBadge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ unlocked: true, unlockedAt: expect.any(Date), awardedById: ADMIN.id }),
      });
      expect(prisma.db.logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actionType: LogsActionType.AdminAwardBadge, targetId: 'ub-9' }),
      });
    });

    it('returns 409 when the user already has it', async () => {
      prisma.db.badge.findUnique.mockResolvedValue(special);
      prisma.db.user.findUnique.mockResolvedValue({ id: USER_ID });
      prisma.db.userBadge.create.mockRejectedValue({ code: 'P2002' });

      const res = await service.awardSpecialBadge('special-1', { userId: USER_ID }, ADMIN);
      expect(res.statusCode).toBe(409);
    });

    it('refuses non-special badges', async () => {
      prisma.db.badge.findUnique.mockResolvedValue(badge());
      prisma.db.user.findUnique.mockResolvedValue({ id: USER_ID });

      const res = await service.awardSpecialBadge('badge-1', { userId: USER_ID }, ADMIN);
      expect(res.statusCode).toBe(API_RESPONSE.ERROR.BADGE_NOT_SPECIAL.code);
      expect(prisma.db.userBadge.create).not.toHaveBeenCalled();
    });
  });

  describe('evaluateAll', () => {
    it('evaluates each user with completed sessions once', async () => {
      prisma.db.booking.findMany.mockResolvedValueOnce([
        { mentorId: 'm1', menteeId: 'e1' },
        { mentorId: 'm1', menteeId: 'e2' },
      ]);
      const spy = jest.spyOn(service, 'evaluateUser').mockResolvedValue();

      expect(await service.evaluateAll()).toBe(3);
      expect(spy.mock.calls.map((c) => c[0])).toEqual(['m1', 'e1', 'e2']);
    });
  });
});
