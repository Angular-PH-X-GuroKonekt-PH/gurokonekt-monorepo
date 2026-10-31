import { MentorBadgeInterface } from '../achievement/achievement.model';

/**
 * A mentor as rendered on the public marketing site.
 *
 * This shape is served by an UNAUTHENTICATED endpoint. Only add fields here that
 * are safe for anyone on the internet to read — no email, phone, session rate,
 * availability, documents, or internal status flags.
 */
export interface FeaturedMentorInterface {
  /** The mentor's User id (not the MentorProfile id). */
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  bio: string | null;
  areasOfExpertise: string[];
  skills: string[];
  avatarUrl: string | null;
  /** Mean of all mentee ratings, rounded to one decimal. `null` when unrated. */
  averageRating: number | null;
  ratingCount: number;
  /** Approved, unexpired achievement badges (issue #419). */
  badges: MentorBadgeInterface[];
}

export interface FeaturedMentorsResponseInterface {
  data: FeaturedMentorInterface[];
  total: number;
}
