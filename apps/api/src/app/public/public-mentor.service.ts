import { Injectable, Logger } from '@nestjs/common';
import {
  API_RESPONSE,
  FEATURED_MENTORS_DEFAULT_LIMIT,
  FeaturedMentorInterface,
  FeaturedMentorsQueryDto,
  MentorAccess,
  ResponseDto,
  ResponseStatus,
  SelectFields,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';

/** Running total used to average a mentor's ratings in one pass. */
interface RatingTally {
  sum: number;
  count: number;
}

@Injectable()
export class PublicMentorService {
  private readonly logger = new Logger(PublicMentorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the mentors an admin has flagged as featured, for the public site.
   *
   * The query is rooted at `MentorProfile` rather than `User` so it can order by
   * `featuredAt`: `mentorProfiles` is a to-many relation on `User`, and Prisma
   * cannot order a `User` query by a related scalar.
   *
   * `MentorAccess.approvedMentorWhere()` is re-applied here rather than trusted
   * from the write side, so a mentor who is later deactivated or rejected drops
   * off the public site immediately without their flag needing to be cleared.
   */
  async getFeaturedMentors(query: FeaturedMentorsQueryDto): Promise<ResponseDto> {
    try {
      const limit = query.limit ?? FEATURED_MENTORS_DEFAULT_LIMIT;

      const profiles = await this.prisma.db.mentorProfile.findMany({
        where: {
          isFeatured: true,
          user: MentorAccess.approvedMentorWhere(),
        },
        select: SelectFields.getFeaturedMentorSelect(),
        orderBy: { featuredAt: 'desc' },
        take: limit,
      });

      if (profiles.length === 0) {
        return {
          status: ResponseStatus.Success,
          statusCode: API_RESPONSE.SUCCESS.PUBLIC_GET_FEATURED_MENTORS.code,
          message: API_RESPONSE.SUCCESS.PUBLIC_GET_FEATURED_MENTORS.message,
          data: [],
        };
      }

      const mentorIds = profiles.map((profile) => profile.user.id);
      const ratings = await this.getRatingsByMentor(mentorIds);

      const data: FeaturedMentorInterface[] = profiles.map((profile) => {
        const tally = ratings.get(profile.user.id);

        return {
          id: profile.user.id,
          firstName: profile.user.firstName,
          lastName: profile.user.lastName,
          title: profile.title,
          bio: profile.bio,
          areasOfExpertise: profile.areasOfExpertise,
          skills: profile.skills,
          avatarUrl: profile.user.avatarAttachments[0]?.publicUrl ?? null,
          averageRating: tally
            ? Math.round((tally.sum / tally.count) * 10) / 10
            : null,
          ratingCount: tally?.count ?? 0,
        };
      });

      return {
        status: ResponseStatus.Success,
        statusCode: API_RESPONSE.SUCCESS.PUBLIC_GET_FEATURED_MENTORS.code,
        message: API_RESPONSE.SUCCESS.PUBLIC_GET_FEATURED_MENTORS.message,
        data,
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: ResponseStatus.Error,
        statusCode: API_RESPONSE.ERROR.PUBLIC_GET_FEATURED_MENTORS.code,
        message: API_RESPONSE.ERROR.PUBLIC_GET_FEATURED_MENTORS.message,
        data: error,
      };
    }
  }

  /**
   * Tallies mentee ratings per mentor.
   *
   * `groupBy` cannot be used here — it only groups by the model's own scalars,
   * and `mentorId` lives on the related `Booking`. The featured set is capped at
   * 50 mentors, so fetching the rows and folding them is cheap.
   */
  private async getRatingsByMentor(
    mentorIds: string[],
  ): Promise<Map<string, RatingTally>> {
    const feedback = await this.prisma.db.bookingFeedback.findMany({
      where: { booking: { mentorId: { in: mentorIds } } },
      select: { rating: true, booking: { select: { mentorId: true } } },
    });

    const tallies = new Map<string, RatingTally>();

    for (const row of feedback) {
      const mentorId = row.booking.mentorId;
      const tally = tallies.get(mentorId) ?? { sum: 0, count: 0 };
      tally.sum += row.rating;
      tally.count += 1;
      tallies.set(mentorId, tally);
    }

    return tallies;
  }
}
