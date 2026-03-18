import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  API_RESPONSE,
  DaysInWeek,
  MentorProfileDetailInterface,
  MentorSearchItemInterface,
  MentorSearchResultInterface,
  ResponseDto,
  ResponseStatus,
  SearchMentorDto,
  SearchSortBy,
  SearchSortOrder,
  UserRole,
  SelectFields
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

      // Load mentee profile for intelligent matching (only when requester is a mentee)
      const menteeProfile =
        authenticatedUserRole === UserRole.Mentee
          ? await this.loadMenteeProfile(authenticatedUserId)
          : null;

      // Build the dynamic where clause
      const where = this.buildWhereClause(dto, menteeProfile);

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

        const sorted = this.sortInMemory(all as unknown as MentorSearchItemInterface[], sortBy, sortOrder);
        const filtered = this.filterByAvailabilityDay(sorted, dto.availabilityDay);
        total = filtered.length;
        results = filtered.slice((page - 1) * limit, page * limit);
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
        results = this.filterByAvailabilityDay(results, dto.availabilityDay);
        total = results.length;
      }

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.GET_BOOKINGS.code,
        message: API_RESPONSE.SUCCESS.GET_BOOKINGS.message,
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
  // PRIVATE – WHERE CLAUSE BUILDER
  // ====================================================

  private buildWhereClause(
    dto: SearchMentorDto,
    menteeProfile: { learningGoals: string[]; areasOfInterest: string[] } | null,
  ) {
    // Top-level AND conditions applied to the User model
    const topLevelAnd: object[] = [
      { role: UserRole.Mentor },
      { status: 'active' },
      { isMentorApproved: true },
      { isMentorProfileComplete: true },
    ];

    // Language filter (case-insensitive)
    if (dto.language) {
      topLevelAnd.push({ language: { equals: dto.language, mode: 'insensitive' } });
    }

    // Name filter (partial, case-insensitive)
    if (dto.name?.trim()) {
      const name = dto.name.trim();
      topLevelAnd.push({
        OR: [
          { firstName: { contains: name, mode: 'insensitive' } },
          { lastName: { contains: name, mode: 'insensitive' } },
        ],
      });
    }

    // Profile-level filter conditions
    const profileConditions: object[] = [];

    // Intelligent matching: combine mentee's learning goals + areas of interest
    // with any explicit expertise / skills filters to produce a single OR clause
    // that matches mentors relevant to the mentee's profile.
    const intelligentExpertiseTerms: string[] = menteeProfile
      ? [...menteeProfile.learningGoals, ...menteeProfile.areasOfInterest]
      : [];
    const explicitExpertiseTerms = dto.expertiseArray;
    const explicitSkillsTerms = dto.skillsArray;

    const allExpertiseTerms = [
      ...new Set([...intelligentExpertiseTerms, ...explicitExpertiseTerms]),
    ];
    const allSkillsTerms = [
      ...new Set([...intelligentExpertiseTerms, ...explicitSkillsTerms]),
    ];

    if (allExpertiseTerms.length > 0 || allSkillsTerms.length > 0) {
      const matchOr: object[] = [];

      if (allExpertiseTerms.length > 0) {
        matchOr.push({ areasOfExpertise: { hasSome: allExpertiseTerms } });
      }
      if (allSkillsTerms.length > 0) {
        matchOr.push({ skills: { hasSome: allSkillsTerms } });
      }

      profileConditions.push({ OR: matchOr });
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
  // PRIVATE – AVAILABILITY DAY POST-FILTER
  // ====================================================

  private filterByAvailabilityDay(
    mentors: MentorSearchItemInterface[],
    day: DaysInWeek | undefined,
  ): MentorSearchItemInterface[] {
    if (!day) return mentors;

    return mentors.filter((mentor) => {
      const availability = mentor.mentorProfiles[0]?.availability;
      if (!availability || !Array.isArray(availability)) return false;
      return (availability as { day: string }[]).some(
        (slot) => slot.day?.toLowerCase() === day.toLowerCase(),
      );
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

      if (
        !profile ||
        profile.user.status !== 'active' ||
        !profile.user.isMentorApproved ||
        !profile.user.isMentorProfileComplete
      ) {
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
        statusCode: API_RESPONSE.SUCCESS.GET_BOOKINGS.code,
        message: 'Mentor profile retrieved successfully',
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
