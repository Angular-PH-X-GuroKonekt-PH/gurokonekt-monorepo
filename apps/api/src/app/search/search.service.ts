import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  API_RESPONSE,
  DaysInWeek,
  DEFAULT_RECOMMENDED_MENTOR_LIMIT,
  MentorProfileDetailInterface,
  MentorRecommendationResultInterface,
  MentorSearchItemInterface,
  MentorSearchResultInterface,
  RecommendedMentorsDto,
  ResponseDto,
  ResponseStatus,
  SearchMentorDto,
  SearchSortBy,
  SearchSortOrder,
  MentorAccess,
  SelectFields,
  UserRole,
} from '@gurokonekt/models';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ====================================================
  // SEARCH MENTORS
  // ====================================================

  async searchMentors(
    dto: SearchMentorDto,
    authenticatedUserId: string,
    authenticatedUserRole: string,
  ): Promise<ResponseDto<MentorSearchResultInterface>> {
    try {
      const page = dto.page ?? 1;
      const limit = dto.limit ?? 10;
      const sortBy = dto.sortBy ?? SearchSortBy.NEWEST;
      const sortOrder = dto.sortOrder ?? SearchSortOrder.DESC;

      // Pre-compute mentor IDs whose skills/expertise match the keyword (case-insensitive).
      // Prisma's hasSome is case-sensitive on PostgreSQL arrays, so we use a raw query.
      const keywordMatchIds = dto.name?.trim()
        ? await this.findMentorIdsByKeyword(dto.name.trim())
        : [];

      // Pre-compute mentor IDs available on the requested day(s). Applied inside the
      // where clause (not as a post-filter) so count() and findMany() agree and
      // `total` stays truthful across pages.
      const availabilityDays = dto.availabilityDaysArray;
      const availabilityMatchIds = availabilityDays.length
        ? await this.findMentorIdsByAvailabilityDay(availabilityDays)
        : null;

      const where = this.buildWhereClause(
        dto,
        keywordMatchIds,
        availabilityMatchIds,
      );

      // For native-sortable fields, delegate ordering to Prisma + use DB-level pagination.
      // For profile-level sorts (sessionRate, yearsExperience) we fetch all matches and
      // sort + paginate in memory (acceptable for typical mentor dataset sizes).
      const needsInMemorySort =
        sortBy === SearchSortBy.SESSION_RATE ||
        sortBy === SearchSortBy.YEARS_EXPERIENCE;

      let results: MentorSearchItemInterface[];
      let total: number;

      if (needsInMemorySort) {
        const all = await this.prisma.db.user.findMany({
          where,
          select: SelectFields.getMentorSearchSelect(),
        });

        const sorted = this.sortInMemory(
          all as unknown as MentorSearchItemInterface[],
          sortBy,
          sortOrder,
        );
        total = sorted.length;
        results = sorted.slice((page - 1) * limit, page * limit);
      } else {
        const orderBy = this.buildOrderBy(sortBy, sortOrder);
        [total, results] = await Promise.all([
          this.prisma.db.user.count({ where }),
          this.prisma.db.user.findMany({
            where,
            select: SelectFields.getMentorSearchSelect(),
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
          }) as unknown as Promise<MentorSearchItemInterface[]>,
        ]);
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_MENTORS.code,
        message: API_RESPONSE.SUCCESS.GET_MENTORS.message,
        data: { total, page, limit, results },
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: null,
      };
    }
  }

  // ====================================================
  // RECOMMENDED MENTORS
  // ====================================================

  async getRecommendedMentors(
    dto: RecommendedMentorsDto,
    authenticatedUserId: string,
    authenticatedUserRole: string,
  ): Promise<ResponseDto<MentorRecommendationResultInterface>> {
    try {
      const limit = dto.limit ?? DEFAULT_RECOMMENDED_MENTOR_LIMIT;

      // Only mentees have goals/interests to personalize against.
      const terms =
        authenticatedUserRole === UserRole.Mentee
          ? await this.loadMenteeMatchTerms(authenticatedUserId)
          : [];

      const matched = terms.length
        ? await this.findMatchedMentors(terms, limit)
        : [];

      // Match first, then top up with the newest mentors so the section is never
      // empty — a mentee with an unfilled or non-overlapping profile still gets
      // a full row of mentors to browse.
      const padding = await this.findNewestMentors(
        limit - matched.length,
        matched.map((mentor) => mentor.id),
      );

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_RECOMMENDED_MENTORS.code,
        message: API_RESPONSE.SUCCESS.GET_RECOMMENDED_MENTORS.message,
        data: {
          results: [...matched, ...padding],
          isPersonalized: matched.length > 0,
        },
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: null,
      };
    }
  }

  // ====================================================
  // PRIVATE – MENTEE PROFILE LOADER
  // ====================================================

  private async loadMenteeProfile(userId: string) {
    try {
      return await this.prisma.db.menteeProfile.findUnique({
        where: { userId },
        select: {
          learningGoals: true,
          areasOfInterest: true,
        },
      });
    } catch {
      return null;
    }
  }

  // ====================================================
  // PRIVATE – CASE-INSENSITIVE ARRAY KEYWORD LOOKUP
  // ====================================================

  private async findMentorIdsByKeyword(keyword: string): Promise<string[]> {
    try {
      const rows = await this.prisma.db.$queryRaw<{ user_id: string }[]>`
        SELECT DISTINCT mp.user_id::text
        FROM mentor_profiles mp
        WHERE EXISTS (
          SELECT 1 FROM unnest(mp.skills) AS s WHERE s ILIKE ${keyword}
        ) OR EXISTS (
          SELECT 1 FROM unnest(mp.areas_of_expertise) AS e WHERE e ILIKE ${keyword}
        )
      `;
      return rows.map((r) => r.user_id);
    } catch {
      return [];
    }
  }

  // ====================================================
  // PRIVATE – CASE-INSENSITIVE MULTI-TERM ARRAY LOOKUP
  // ====================================================

  private async findMentorIdsByTerms(terms: string[]): Promise<string[]> {
    if (!terms.length) return [];

    try {
      const rows = await this.prisma.db.$queryRaw<{ user_id: string }[]>`
        SELECT DISTINCT mp.user_id::text
        FROM mentor_profiles mp
        WHERE EXISTS (
          SELECT 1 FROM unnest(mp.skills) AS s WHERE s ILIKE ANY(${terms}::text[])
        ) OR EXISTS (
          SELECT 1 FROM unnest(mp.areas_of_expertise) AS e WHERE e ILIKE ANY(${terms}::text[])
        )
      `;
      return rows.map((r) => r.user_id);
    } catch {
      return [];
    }
  }

  // ====================================================
  // PRIVATE – RECOMMENDATION FETCH HELPERS
  // ====================================================

  private async loadMenteeMatchTerms(userId: string): Promise<string[]> {
    const profile = await this.loadMenteeProfile(userId);
    if (!profile) return [];

    return [
      ...new Set(
        [...profile.learningGoals, ...profile.areasOfInterest]
          .map((term) => term.trim())
          .filter(Boolean),
      ),
    ];
  }

  private async findMatchedMentors(
    terms: string[],
    take: number,
  ): Promise<MentorSearchItemInterface[]> {
    const matchedIds = await this.findMentorIdsByTerms(terms);
    if (!matchedIds.length) return [];

    return this.prisma.db.user.findMany({
      where: {
        AND: [MentorAccess.approvedMentorWhere(), { id: { in: matchedIds } }],
      },
      select: SelectFields.getMentorSearchSelect(),
      orderBy: { createdAt: 'desc' },
      take,
    }) as unknown as Promise<MentorSearchItemInterface[]>;
  }

  private async findNewestMentors(
    take: number,
    excludeIds: string[],
  ): Promise<MentorSearchItemInterface[]> {
    if (take <= 0) return [];

    return this.prisma.db.user.findMany({
      where: {
        AND: [
          MentorAccess.approvedMentorWhere(),
          ...(excludeIds.length ? [{ id: { notIn: excludeIds } }] : []),
        ],
      },
      select: SelectFields.getMentorSearchSelect(),
      orderBy: { createdAt: 'desc' },
      take,
    }) as unknown as Promise<MentorSearchItemInterface[]>;
  }

  // ====================================================
  // PRIVATE – AVAILABILITY DAY ID LOOKUP
  // ====================================================

  private async findMentorIdsByAvailabilityDay(
    days: DaysInWeek[],
  ): Promise<string[]> {
    try {
      const rows = await this.prisma.db.$queryRaw<{ user_id: string }[]>`
        SELECT DISTINCT mp.user_id::text
        FROM mentor_profiles mp,
             jsonb_array_elements(
               CASE WHEN jsonb_typeof(mp.availability) = 'array'
                 THEN mp.availability
                 ELSE '[]'::jsonb
               END
             ) AS slot
        WHERE lower(slot->>'day') = ANY(${days}::text[])
      `;
      return rows.map((r) => r.user_id);
    } catch {
      return [];
    }
  }

  // ====================================================
  // PRIVATE – WHERE CLAUSE BUILDER
  // ====================================================

  private buildWhereClause(
    dto: SearchMentorDto,
    keywordMatchIds: string[],
    availabilityMatchIds: string[] | null,
  ) {
    // Top-level AND conditions applied to the User model
    const topLevelAnd: object[] = [MentorAccess.approvedMentorWhere()];

    // Language filter (case-insensitive)
    if (dto.language) {
      topLevelAnd.push({ language: { equals: dto.language, mode: 'insensitive' } });
    }

    // Availability-day filter. An empty array is intentional and matches nothing —
    // it means the day was requested but no mentor is free then. Do not skip the
    // clause when empty; that would silently drop the filter.
    if (availabilityMatchIds !== null) {
      topLevelAnd.push({ id: { in: availabilityMatchIds } });
    }

    // Keyword filter — case-insensitive match across name, bio, title, skills, and expertise.
    // Array fields (skills, expertise) are handled via keywordMatchIds from a raw SQL query
    // because Prisma's hasSome is case-sensitive on PostgreSQL array columns.
    if (dto.name?.trim()) {
      const keyword = dto.name.trim();
      const orConditions: object[] = [
        { firstName: { contains: keyword, mode: 'insensitive' } },
        { lastName: { contains: keyword, mode: 'insensitive' } },
        {
          mentorProfiles: {
            some: {
              OR: [
                { bio: { contains: keyword, mode: 'insensitive' } },
                { title: { contains: keyword, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];

      if (keywordMatchIds.length > 0) {
        orConditions.push({ id: { in: keywordMatchIds } });
      }

      topLevelAnd.push({ OR: orConditions });
    }

    // Profile-level filter conditions — explicit filters only.
    const profileConditions: object[] = [];

    if (dto.expertiseArray.length > 0) {
      profileConditions.push({ areasOfExpertise: { hasSome: dto.expertiseArray } });
    }

    if (dto.skillsArray.length > 0) {
      profileConditions.push({ skills: { hasSome: dto.skillsArray } });
    }

    // Session rate range
    if (
      dto.minSessionRate !== undefined ||
      dto.maxSessionRate !== undefined
    ) {
      profileConditions.push({
        sessionRate: {
          ...(dto.minSessionRate !== undefined ? { gte: dto.minSessionRate } : {}),
          ...(dto.maxSessionRate !== undefined ? { lte: dto.maxSessionRate } : {}),
        },
      });
    }

    // Years of experience range
    if (dto.minYearsExperience !== undefined || dto.maxYearsExperience !== undefined) {
      profileConditions.push({
        yearsOfExperience: {
          ...(dto.minYearsExperience !== undefined ? { gte: dto.minYearsExperience } : {}),
          ...(dto.maxYearsExperience !== undefined ? { lte: dto.maxYearsExperience } : {}),
        },
      });
    }

    // Attach profile conditions. Always require at least one mentorProfile record.
    topLevelAnd.push({
      mentorProfiles: {
        some: profileConditions.length > 0 ? { AND: profileConditions } : {},
      },
    });

    return { AND: topLevelAnd };
  }

  // ====================================================
  // PRIVATE – ORDER-BY BUILDER (DB-level sorts)
  // ====================================================

  private buildOrderBy(sortBy: SearchSortBy, sortOrder: SearchSortOrder) {
    switch (sortBy) {
      case SearchSortBy.NAME:
        return [
          { firstName: sortOrder },
          { lastName: sortOrder },
        ];
      case SearchSortBy.NEWEST:
      default:
        return { createdAt: sortOrder };
    }
  }

  // ====================================================
  // PRIVATE – IN-MEMORY SORT (profile-level fields)
  // ====================================================

  private sortInMemory(
    mentors: MentorSearchItemInterface[],
    sortBy: SearchSortBy,
    sortOrder: SearchSortOrder,
  ): MentorSearchItemInterface[] {
    const direction = sortOrder === SearchSortOrder.ASC ? 1 : -1;

    return [...mentors].sort((a, b) => {
      const profileA = a.mentorProfiles[0];
      const profileB = b.mentorProfiles[0];

      if (!profileA && !profileB) return 0;
      if (!profileA) return 1;
      if (!profileB) return -1;

      if (sortBy === SearchSortBy.SESSION_RATE) {
        const rateA = profileA.sessionRate ?? 0;
        const rateB = profileB.sessionRate ?? 0;
        return (rateA - rateB) * direction;
      }

      if (sortBy === SearchSortBy.YEARS_EXPERIENCE) {
        const yearsA = profileA.yearsOfExperience ?? 0;
        const yearsB = profileB.yearsOfExperience ?? 0;
        return (yearsA - yearsB) * direction;
      }

      return 0;
    });
  }

  // ====================================================
  // GET MENTOR PROFILE BY ID
  // ====================================================

  async getMentorProfileById(
    mentorId: string,
  ): Promise<ResponseDto<MentorProfileDetailInterface | null>> {
    try {
      const profile = await this.prisma.db.mentorProfile.findUnique({
        where: { userId: mentorId },
        select: {
          id: true,
          title: true,
          bio: true,
          areasOfExpertise: true,
          yearsOfExperience: true,
          skills: true,
          sessionRate: true,
          availability: true,
          linkedInUrl: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              suffix: true,
              language: true,
              country: true,
              timezone: true,
              role: true,
              status: true,
              isMentorApproved: true,
              isMentorProfileComplete: true,
              avatarAttachments: {
                select: { publicUrl: true, fileName: true },
              },
            },
          },
        },
      });

      if (!profile || !MentorAccess.isApprovedMentor(profile.user)) {
        return {
          status: ResponseStatus.Error,
          statusCode: API_RESPONSE.ERROR.USER_NOT_FOUND.code,
          message: 'Mentor not found or not available',
          data: null,
        };
      }

      const { user } = profile;
      const result: MentorProfileDetailInterface = {
        id: profile.id,
        title: profile.title,
        bio: profile.bio,
        areasOfExpertise: profile.areasOfExpertise,
        yearsOfExperience: profile.yearsOfExperience,
        skills: profile.skills,
        sessionRate: profile.sessionRate,
        availability: profile.availability,
        linkedInUrl: profile.linkedInUrl,
        updatedAt: profile.updatedAt,
        user: {
          id: user.id,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          suffix: user.suffix,
          language: user.language,
          country: user.country,
          timezone: user.timezone,
          avatarAttachments: user.avatarAttachments,
        },
      };

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_MENTOR_PROFILE.code,
        message: API_RESPONSE.SUCCESS.GET_MENTOR_PROFILE.message,
        data: result,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.code,
        message: API_RESPONSE.ERROR.INTERNAL_SERVER_ERROR.message,
        data: null,
      };
    }
  }
}
