import { Test, TestingModule } from '@nestjs/testing';
import {
  RecommendedMentorsDto,
  SearchMentorDto,
  UserRole,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from './search.service';

export type PrismaMock = {
  db: {
    user: { findMany: jest.Mock; count: jest.Mock };
    menteeProfile: { findUnique: jest.Mock };
    mentorProfile: { findUnique: jest.Mock };
    $queryRaw: jest.Mock;
  };
};

const createPrismaMock = (): PrismaMock => ({
  db: {
    user: { findMany: jest.fn(), count: jest.fn() },
    menteeProfile: { findUnique: jest.fn() },
    mentorProfile: { findUnique: jest.fn() },
    $queryRaw: jest.fn(),
  },
});

const buildMentorRow = (id: string) => ({
  id,
  firstName: 'Mentor',
  middleName: null,
  lastName: id,
  suffix: null,
  email: `${id}@example.com`,
  country: 'PH',
  timezone: 'Asia/Manila',
  language: 'English',
  isMentorApproved: true,
  isMentorProfileComplete: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  avatarAttachments: [],
  mentorProfiles: [
    {
      id: `${id}-profile`,
      title: 'Engineer',
      areasOfExpertise: ['Cooking'],
      yearsOfExperience: 5,
      bio: 'A mentor bio',
      skills: ['Baking'],
      sessionRate: 50,
      availability: [
        { day: 'monday', timeFrames: [{ from: '09:00', to: '12:00' }] },
      ],
      linkedInUrl: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ],
});

const buildDto = (overrides: Partial<SearchMentorDto> = {}): SearchMentorDto =>
  Object.assign(new SearchMentorDto(), overrides);

describe('SearchService', () => {
  let service: SearchService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(SearchService);
  });

  describe('searchMentors', () => {
    it('does not filter a mentee by their own goals or interests', async () => {
      prisma.db.menteeProfile.findUnique.mockResolvedValue({
        learningGoals: ['Quantum Physics'],
        areasOfInterest: ['Astrophysics'],
      });
      prisma.db.user.count.mockResolvedValue(2);
      prisma.db.user.findMany.mockResolvedValue([
        buildMentorRow('m1'),
        buildMentorRow('m2'),
      ]);

      const response = await service.searchMentors(
        buildDto(),
        'mentee-1',
        UserRole.Mentee,
      );

      expect(response.data?.results).toHaveLength(2);
      expect(response.data?.total).toBe(2);

      const where = JSON.stringify(
        prisma.db.user.findMany.mock.calls[0][0].where,
      );
      expect(where).not.toContain('Quantum Physics');
      expect(where).not.toContain('Astrophysics');
    });

    it('still applies explicit expertise filters', async () => {
      prisma.db.user.count.mockResolvedValue(1);
      prisma.db.user.findMany.mockResolvedValue([buildMentorRow('m1')]);

      await service.searchMentors(
        buildDto({ expertise: 'Web Development' }),
        'mentee-1',
        UserRole.Mentee,
      );

      const where = JSON.stringify(
        prisma.db.user.findMany.mock.calls[0][0].where,
      );
      expect(where).toContain('Web Development');
    });

    it('reports the true total when an availability-day filter is applied', async () => {
      prisma.db.$queryRaw.mockResolvedValue([
        { user_id: 'm1' },
        { user_id: 'm2' },
      ]);
      prisma.db.user.count.mockResolvedValue(25);
      prisma.db.user.findMany.mockResolvedValue([buildMentorRow('m1')]);

      const response = await service.searchMentors(
        buildDto({ availabilityDay: 'monday', limit: 1 }),
        'mentee-1',
        UserRole.Mentee,
      );

      expect(response.data?.total).toBe(25);
      expect(response.data?.results).toHaveLength(1);

      const where = JSON.stringify(
        prisma.db.user.findMany.mock.calls[0][0].where,
      );
      expect(where).toContain('"in":["m1","m2"]');
    });

    it('matches nothing when no mentor is available on the requested day', async () => {
      prisma.db.$queryRaw.mockResolvedValue([]);
      prisma.db.user.count.mockResolvedValue(0);
      prisma.db.user.findMany.mockResolvedValue([]);

      const response = await service.searchMentors(
        buildDto({ availabilityDay: 'sunday' }),
        'mentee-1',
        UserRole.Mentee,
      );

      const where = JSON.stringify(
        prisma.db.user.findMany.mock.calls[0][0].where,
      );
      expect(where).toContain('"in":[]');
      expect(response.data?.total).toBe(0);
    });

    it('returns the mentor-search success code', async () => {
      prisma.db.user.count.mockResolvedValue(0);
      prisma.db.user.findMany.mockResolvedValue([]);

      const response = await service.searchMentors(
        buildDto(),
        'mentee-1',
        UserRole.Mentee,
      );

      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Mentors retrieved successfully');
    });
  });

  describe('getRecommendedMentors', () => {
    it('marks results personalized when the mentee profile matches', async () => {
      prisma.db.menteeProfile.findUnique.mockResolvedValue({
        learningGoals: ['Baking'],
        areasOfInterest: [],
      });
      prisma.db.$queryRaw.mockResolvedValue([{ user_id: 'm1' }]);
      prisma.db.user.findMany
        .mockResolvedValueOnce([buildMentorRow('m1')])
        .mockResolvedValueOnce([buildMentorRow('m2'), buildMentorRow('m3')]);

      const response = await service.getRecommendedMentors(
        Object.assign(new RecommendedMentorsDto(), { limit: 3 }),
        'mentee-1',
        UserRole.Mentee,
      );

      expect(response.data?.isPersonalized).toBe(true);
      expect(response.data?.results.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    });

    it('tops up with newest mentors and reports not personalized when nothing matches', async () => {
      prisma.db.menteeProfile.findUnique.mockResolvedValue({
        learningGoals: ['Quantum Physics'],
        areasOfInterest: [],
      });
      prisma.db.$queryRaw.mockResolvedValue([]);
      prisma.db.user.findMany.mockResolvedValue([
        buildMentorRow('m1'),
        buildMentorRow('m2'),
      ]);

      const response = await service.getRecommendedMentors(
        Object.assign(new RecommendedMentorsDto(), { limit: 2 }),
        'mentee-1',
        UserRole.Mentee,
      );

      expect(response.data?.isPersonalized).toBe(false);
      expect(response.data?.results).toHaveLength(2);
    });

    it('returns newest mentors without a term query for a mentee with an empty profile', async () => {
      prisma.db.menteeProfile.findUnique.mockResolvedValue({
        learningGoals: [],
        areasOfInterest: [],
      });
      prisma.db.user.findMany.mockResolvedValue([buildMentorRow('m1')]);

      const response = await service.getRecommendedMentors(
        Object.assign(new RecommendedMentorsDto(), {}),
        'mentee-1',
        UserRole.Mentee,
      );

      expect(response.data?.isPersonalized).toBe(false);
      expect(prisma.db.$queryRaw).not.toHaveBeenCalled();
    });

    it('does not personalize for non-mentee callers', async () => {
      prisma.db.user.findMany.mockResolvedValue([buildMentorRow('m1')]);

      const response = await service.getRecommendedMentors(
        Object.assign(new RecommendedMentorsDto(), {}),
        'admin-1',
        UserRole.Admin,
      );

      expect(response.data?.isPersonalized).toBe(false);
      expect(prisma.db.menteeProfile.findUnique).not.toHaveBeenCalled();
    });

    it('passes all mentee terms to the case-insensitive term query', async () => {
      prisma.db.menteeProfile.findUnique.mockResolvedValue({
        learningGoals: ['web development'],
        areasOfInterest: ['Design'],
      });
      prisma.db.$queryRaw.mockResolvedValue([{ user_id: 'm1' }]);
      prisma.db.user.findMany.mockResolvedValue([buildMentorRow('m1')]);

      await service.getRecommendedMentors(
        Object.assign(new RecommendedMentorsDto(), { limit: 1 }),
        'mentee-1',
        UserRole.Mentee,
      );

      const terms = prisma.db.$queryRaw.mock.calls[0][1];
      expect(terms).toEqual(['web development', 'Design']);
    });
  });
});
