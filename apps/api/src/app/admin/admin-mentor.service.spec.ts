import { Test, TestingModule } from '@nestjs/testing';
import {
  API_RESPONSE,
  LogsActionType,
  ResponseStatus,
  UserRole,
  UserStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AdminMentorService } from './admin-mentor.service';

const MENTOR_ID = 'mentor-1';
const PROFILE_ID = 'profile-1';
const ADMIN_ID = 'admin-1';
const IP = '127.0.0.1';
const AGENT = 'jest';

type PrismaMock = {
  db: {
    user: { findFirst: jest.Mock };
    mentorProfile: { update: jest.Mock };
    logs: { create: jest.Mock };
  };
};

const createPrismaMock = (): PrismaMock => ({
  db: {
    user: { findFirst: jest.fn() },
    mentorProfile: { update: jest.fn() },
    logs: { create: jest.fn() },
  },
});

/** An approved mentor with a complete profile — the only featurable state. */
const buildMentor = (overrides = {}) => ({
  id: MENTOR_ID,
  role: UserRole.Mentor,
  status: UserStatus.Approved,
  isMentorApproved: true,
  isMentorProfileComplete: true,
  mentorProfiles: [{ id: PROFILE_ID }],
  ...overrides,
});

describe('AdminMentorService', () => {
  let service: AdminMentorService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminMentorService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<AdminMentorService>(AdminMentorService);
    prisma.db.mentorProfile.update.mockResolvedValue({
      id: PROFILE_ID,
      isFeatured: true,
      featuredAt: new Date(),
    });
  });

  describe('setMentorFeatured', () => {
    it('features an approved mentor and stamps featuredAt', async () => {
      prisma.db.user.findFirst.mockResolvedValue(buildMentor());

      const result = await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: true },
        ADMIN_ID,
        IP,
        AGENT,
      );

      expect(result.status).toBe(ResponseStatus.Success);
      expect(result.statusCode).toBe(
        API_RESPONSE.SUCCESS.ADMIN_SET_MENTOR_FEATURED.code,
      );

      const updateArgs = prisma.db.mentorProfile.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: PROFILE_ID });
      expect(updateArgs.data.isFeatured).toBe(true);
      expect(updateArgs.data.featuredAt).toBeInstanceOf(Date);
    });

    it('writes an audit log when featuring', async () => {
      prisma.db.user.findFirst.mockResolvedValue(buildMentor());

      await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: true },
        ADMIN_ID,
        IP,
        AGENT,
      );

      const logArgs = prisma.db.logs.create.mock.calls[0][0];
      expect(logArgs.data.actionType).toBe(LogsActionType.AdminFeatureMentor);
      expect(logArgs.data.targetId).toBe(MENTOR_ID);
      expect(logArgs.data.createdById).toBe(ADMIN_ID);
    });

    it('clears featuredAt when un-featuring', async () => {
      prisma.db.user.findFirst.mockResolvedValue(buildMentor());

      await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: false },
        ADMIN_ID,
        IP,
        AGENT,
      );

      const updateArgs = prisma.db.mentorProfile.update.mock.calls[0][0];
      expect(updateArgs.data.isFeatured).toBe(false);
      expect(updateArgs.data.featuredAt).toBeNull();
      expect(prisma.db.logs.create.mock.calls[0][0].data.actionType).toBe(
        LogsActionType.AdminUnfeatureMentor,
      );
    });

    it('refuses to feature a rejected mentor', async () => {
      prisma.db.user.findFirst.mockResolvedValue(
        buildMentor({ status: UserStatus.Rejected }),
      );

      const result = await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: true },
        ADMIN_ID,
        IP,
        AGENT,
      );

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_FEATURE.code,
      );
      expect(prisma.db.mentorProfile.update).not.toHaveBeenCalled();
      expect(prisma.db.logs.create).not.toHaveBeenCalled();
    });

    it('refuses to feature a mentor with an incomplete profile', async () => {
      prisma.db.user.findFirst.mockResolvedValue(
        buildMentor({ isMentorProfileComplete: false }),
      );

      const result = await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: true },
        ADMIN_ID,
        IP,
        AGENT,
      );

      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_FEATURE.code,
      );
      expect(prisma.db.mentorProfile.update).not.toHaveBeenCalled();
    });

    it('refuses to feature an inactive mentor', async () => {
      prisma.db.user.findFirst.mockResolvedValue(
        buildMentor({ status: UserStatus.Inactive }),
      );

      const result = await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: true },
        ADMIN_ID,
        IP,
        AGENT,
      );

      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.MENTOR_INVALID_STATUS_FOR_FEATURE.code,
      );
    });

    it('always allows un-featuring, even for a mentor who lost eligibility', async () => {
      prisma.db.user.findFirst.mockResolvedValue(
        buildMentor({ status: UserStatus.Inactive }),
      );

      const result = await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: false },
        ADMIN_ID,
        IP,
        AGENT,
      );

      expect(result.status).toBe(ResponseStatus.Success);
      expect(prisma.db.mentorProfile.update).toHaveBeenCalled();
    });

    it('returns USER_NOT_FOUND for an unknown mentor', async () => {
      prisma.db.user.findFirst.mockResolvedValue(null);

      const result = await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: true },
        ADMIN_ID,
        IP,
        AGENT,
      );

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(API_RESPONSE.ERROR.USER_NOT_FOUND.code);
    });

    it('returns MENTOR_PROFILE_NOT_FOUND when the mentor has no profile row', async () => {
      prisma.db.user.findFirst.mockResolvedValue(
        buildMentor({ mentorProfiles: [] }),
      );

      const result = await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: true },
        ADMIN_ID,
        IP,
        AGENT,
      );

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.MENTOR_PROFILE_NOT_FOUND.code,
      );
    });

    it('returns an error response instead of throwing when Prisma fails', async () => {
      prisma.db.user.findFirst.mockRejectedValue(new Error('db down'));

      const result = await service.setMentorFeatured(
        MENTOR_ID,
        { isFeatured: true },
        ADMIN_ID,
        IP,
        AGENT,
      );

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.ADMIN_SET_MENTOR_FEATURED.code,
      );
    });
  });
});
