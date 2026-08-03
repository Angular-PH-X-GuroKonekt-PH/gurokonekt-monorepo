import { Test, TestingModule } from '@nestjs/testing';
import {
  API_RESPONSE,
  FeaturedMentorInterface,
  MentorAccess,
  ResponseStatus,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { PublicMentorService } from './public-mentor.service';

const MENTOR_A = 'mentor-a';
const MENTOR_B = 'mentor-b';

type PrismaMock = {
  db: {
    mentorProfile: { findMany: jest.Mock };
    bookingFeedback: { findMany: jest.Mock };
  };
};

const createPrismaMock = (): PrismaMock => ({
  db: {
    mentorProfile: { findMany: jest.fn() },
    bookingFeedback: { findMany: jest.fn() },
  },
});

/** A row as returned by `getFeaturedMentorSelect()` — profile-rooted. */
const buildProfileRow = (userId: string, overrides = {}) => ({
  title: 'Senior Software Engineer',
  bio: 'Ten years building distributed systems.',
  areasOfExpertise: ['Software Engineering'],
  skills: ['TypeScript', 'Kubernetes'],
  featuredAt: new Date('2026-08-01T00:00:00.000Z'),
  user: {
    id: userId,
    firstName: 'Maria',
    lastName: 'Santos',
    avatarAttachments: [{ publicUrl: 'https://cdn.test/avatar.png' }],
  },
  ...overrides,
});

const buildFeedback = (mentorId: string, rating: number) => ({
  rating,
  booking: { mentorId },
});

/** `ResponseDto.data` is `unknown`; narrow it for assertions. */
const rows = (data: unknown) => data as FeaturedMentorInterface[];

describe('PublicMentorService', () => {
  let service: PublicMentorService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicMentorService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PublicMentorService>(PublicMentorService);
  });

  describe('getFeaturedMentors', () => {
    it('only returns featured mentors who pass the MentorAccess filter', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([]);

      await service.getFeaturedMentors({});

      const args = prisma.db.mentorProfile.findMany.mock.calls[0][0];
      expect(args.where.isFeatured).toBe(true);
      expect(args.where.user).toEqual(MentorAccess.approvedMentorWhere());
    });

    it('defaults to a limit of 12', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([]);

      await service.getFeaturedMentors({});

      expect(prisma.db.mentorProfile.findMany.mock.calls[0][0].take).toBe(12);
    });

    it('honours an explicit limit', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([]);

      await service.getFeaturedMentors({ limit: 3 });

      expect(prisma.db.mentorProfile.findMany.mock.calls[0][0].take).toBe(3);
    });

    it('orders by featuredAt descending', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([]);

      await service.getFeaturedMentors({});

      expect(prisma.db.mentorProfile.findMany.mock.calls[0][0].orderBy).toEqual({
        featuredAt: 'desc',
      });
    });

    it('returns success with an empty array when nothing is featured', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([]);

      const result = await service.getFeaturedMentors({});

      expect(result.status).toBe(ResponseStatus.Success);
      expect(result.statusCode).toBe(
        API_RESPONSE.SUCCESS.PUBLIC_GET_FEATURED_MENTORS.code,
      );
      expect(result.data).toEqual([]);
      // No point querying feedback for an empty mentor set
      expect(prisma.db.bookingFeedback.findMany).not.toHaveBeenCalled();
    });

    it('reports a null rating for a mentor with no feedback', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([buildProfileRow(MENTOR_A)]);
      prisma.db.bookingFeedback.findMany.mockResolvedValue([]);

      const result = await service.getFeaturedMentors({});

      expect(rows(result.data)[0].averageRating).toBeNull();
      expect(rows(result.data)[0].ratingCount).toBe(0);
    });

    it('rounds the average rating to one decimal', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([buildProfileRow(MENTOR_A)]);
      // 4 + 4 + 3 = 11 over 3 ratings = 3.666… -> 3.7
      prisma.db.bookingFeedback.findMany.mockResolvedValue([
        buildFeedback(MENTOR_A, 4),
        buildFeedback(MENTOR_A, 4),
        buildFeedback(MENTOR_A, 3),
      ]);

      const result = await service.getFeaturedMentors({});

      expect(rows(result.data)[0].averageRating).toBe(3.7);
      expect(rows(result.data)[0].ratingCount).toBe(3);
    });

    it('attributes ratings to the correct mentor', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([
        buildProfileRow(MENTOR_A),
        buildProfileRow(MENTOR_B),
      ]);
      prisma.db.bookingFeedback.findMany.mockResolvedValue([
        buildFeedback(MENTOR_A, 5),
        buildFeedback(MENTOR_B, 1),
        buildFeedback(MENTOR_B, 2),
      ]);

      const result = await service.getFeaturedMentors({});

      const byId = Object.fromEntries(
        rows(result.data).map((m) => [m.id, m]),
      );
      expect(byId[MENTOR_A].averageRating).toBe(5);
      expect(byId[MENTOR_A].ratingCount).toBe(1);
      expect(byId[MENTOR_B].averageRating).toBe(1.5);
      expect(byId[MENTOR_B].ratingCount).toBe(2);
    });

    it('flattens the user relation into the response shape', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([buildProfileRow(MENTOR_A)]);
      prisma.db.bookingFeedback.findMany.mockResolvedValue([]);

      const result = await service.getFeaturedMentors({});

      expect(rows(result.data)[0]).toEqual({
        id: MENTOR_A,
        firstName: 'Maria',
        lastName: 'Santos',
        title: 'Senior Software Engineer',
        bio: 'Ten years building distributed systems.',
        areasOfExpertise: ['Software Engineering'],
        skills: ['TypeScript', 'Kubernetes'],
        avatarUrl: 'https://cdn.test/avatar.png',
        averageRating: null,
        ratingCount: 0,
      });
    });

    it('returns a null avatarUrl when the mentor has no avatar', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([
        buildProfileRow(MENTOR_A, {
          user: {
            id: MENTOR_A,
            firstName: 'Maria',
            lastName: 'Santos',
            avatarAttachments: [],
          },
        }),
      ]);
      prisma.db.bookingFeedback.findMany.mockResolvedValue([]);

      const result = await service.getFeaturedMentors({});

      expect(rows(result.data)[0].avatarUrl).toBeNull();
    });

    it('never leaks private fields into the public payload', async () => {
      prisma.db.mentorProfile.findMany.mockResolvedValue([buildProfileRow(MENTOR_A)]);
      prisma.db.bookingFeedback.findMany.mockResolvedValue([]);

      const result = await service.getFeaturedMentors({});

      for (const key of [
        'email',
        'phoneNumber',
        'sessionRate',
        'availability',
        'linkedInUrl',
        'status',
        'isMentorApproved',
      ]) {
        expect(rows(result.data)[0]).not.toHaveProperty(key);
      }
    });

    it('returns an error response instead of throwing when Prisma fails', async () => {
      prisma.db.mentorProfile.findMany.mockRejectedValue(new Error('db down'));

      const result = await service.getFeaturedMentors({});

      expect(result.status).toBe(ResponseStatus.Error);
      expect(result.statusCode).toBe(
        API_RESPONSE.ERROR.PUBLIC_GET_FEATURED_MENTORS.code,
      );
    });
  });
});
