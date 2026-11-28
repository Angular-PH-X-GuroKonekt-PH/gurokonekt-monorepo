export enum BadgeCategory {
  Mentor = 'MENTOR',
  Mentee = 'MENTEE',
  Special = 'SPECIAL',
}

export enum BadgeRarity {
  Common = 'COMMON',
  Uncommon = 'UNCOMMON',
  Rare = 'RARE',
  Epic = 'EPIC',
  Legendary = 'LEGENDARY',
}

/** What a badge counts. Each value is one number the backend computes per user. */
export enum BadgeRequirementType {
  MentorCompletedSessions = 'mentor_completed_sessions',
  MentorFiveStarReviews = 'mentor_five_star_reviews',
  MentorConsecutiveWeeks = 'mentor_consecutive_weeks',
  MentorUniqueMentees = 'mentor_unique_mentees',
  MenteeCompletedSessions = 'mentee_completed_sessions',
  MenteeConsecutiveWeeks = 'mentee_consecutive_weeks',
  MenteeUniqueMentors = 'mentee_unique_mentors',
  /** Completed sessions the mentee also reviewed. */
  MenteeReviewedSessions = 'mentee_reviewed_sessions',
  // No platform data yet — these badges are seeded disabled.
  MentorPublishedResources = 'mentor_published_resources',
  MentorEventsSpoken = 'mentor_events_spoken',
  MentorEventsParticipated = 'mentor_events_participated',
  MentorResponseRateDays = 'mentor_response_rate_days',
  MenteeCompletedGoals = 'mentee_completed_goals',
  MenteeCompletedCourses = 'mentee_completed_courses',
  MenteePositiveMentorFeedback = 'mentee_positive_mentor_feedback',
  MenteeEventsAttended = 'mentee_events_attended',
  /** Special badges: awarded by an admin, no progress. */
  Manual = 'manual',
}

/** Requirement types the backend can count today. */
export const SUPPORTED_BADGE_REQUIREMENTS: BadgeRequirementType[] = [
  BadgeRequirementType.MentorCompletedSessions,
  BadgeRequirementType.MentorFiveStarReviews,
  BadgeRequirementType.MentorConsecutiveWeeks,
  BadgeRequirementType.MentorUniqueMentees,
  BadgeRequirementType.MenteeCompletedSessions,
  BadgeRequirementType.MenteeConsecutiveWeeks,
  BadgeRequirementType.MenteeUniqueMentors,
  BadgeRequirementType.MenteeReviewedSessions,
];

export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirementType: BadgeRequirementType;
  requirementValue: number;
  active: boolean;
}

const M = BadgeCategory.Mentor;
const E = BadgeCategory.Mentee;
const S = BadgeCategory.Special;
const R = BadgeRarity;
const T = BadgeRequirementType;

const def = (
  code: string,
  name: string,
  description: string,
  category: BadgeCategory,
  rarity: BadgeRarity,
  requirementType: BadgeRequirementType,
  requirementValue: number,
): BadgeDefinition => ({
  code,
  name,
  description,
  category,
  rarity,
  requirementType,
  requirementValue,
  active: requirementType === T.Manual || SUPPORTED_BADGE_REQUIREMENTS.includes(requirementType),
});

/**
 * The badges from epic #284. Codes are stable identifiers: never rename one.
 * Seeded on startup with skip-duplicates, so admin edits are never overwritten.
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Mentor
  def('MENTOR_FIRST_GUIDANCE', 'First Guidance', 'Complete 1 mentorship session', M, R.Common, T.MentorCompletedSessions, 1),
  def('MENTOR_HELPING_HAND', 'Helping Hand', 'Complete 5 mentorship sessions', M, R.Uncommon, T.MentorCompletedSessions, 5),
  def('MENTOR_TRUSTED_GUIDE', 'Trusted Guide', 'Complete 10 mentorship sessions', M, R.Rare, T.MentorCompletedSessions, 10),
  def('MENTOR_MENTORSHIP_PRO', 'Mentorship Pro', 'Complete 25 mentorship sessions', M, R.Epic, T.MentorCompletedSessions, 25),
  def('MENTOR_CENTURY_MENTOR', 'Century Mentor', 'Complete 100 mentorship sessions', M, R.Legendary, T.MentorCompletedSessions, 100),
  def('MENTOR_FIVE_STAR_MENTOR', 'Five-Star Mentor', 'Receive 5 five-star reviews', M, R.Uncommon, T.MentorFiveStarReviews, 5),
  def('MENTOR_MENTEE_FAVORITE', 'Mentee Favorite', 'Receive 20 five-star reviews', M, R.Epic, T.MentorFiveStarReviews, 20),
  def('MENTOR_ON_A_ROLL', 'On a Roll', 'Mentor for 4 consecutive weeks', M, R.Rare, T.MentorConsecutiveWeeks, 4),
  def('MENTOR_KNOWLEDGE_SHARER', 'Knowledge Sharer', 'Publish 1 learning resource', M, R.Common, T.MentorPublishedResources, 1),
  def('MENTOR_MASTER_EDUCATOR', 'Master Educator', 'Publish 5 learning resources', M, R.Rare, T.MentorPublishedResources, 5),
  def('MENTOR_COMMUNITY_SPEAKER', 'Community Speaker', 'Speak at 1 GuroKonekt event', M, R.Rare, T.MentorEventsSpoken, 1),
  def('MENTOR_COMMUNITY_BUILDER', 'Community Builder', 'Participate in 5 GuroKonekt events', M, R.Rare, T.MentorEventsParticipated, 5),
  def('MENTOR_QUICK_RESPONDER', 'Quick Responder', 'Maintain the required response rate for 30 days', M, R.Rare, T.MentorResponseRateDays, 30),
  def('MENTOR_IMPACT_MAKER', 'Impact Maker', 'Mentor 25 unique mentees', M, R.Epic, T.MentorUniqueMentees, 25),
  def('MENTOR_GURO_LEGEND', 'Guro Legend', 'Complete 250 mentorship sessions', M, R.Legendary, T.MentorCompletedSessions, 250),
  // Mentee
  def('MENTEE_FIRST_STEP', 'First Step', 'Complete 1 mentorship session', E, R.Common, T.MenteeCompletedSessions, 1),
  def('MENTEE_EXPLORER', 'Explorer', 'Complete 3 mentorship sessions', E, R.Common, T.MenteeCompletedSessions, 3),
  def('MENTEE_DEDICATED_LEARNER', 'Dedicated Learner', 'Complete 10 mentorship sessions', E, R.Rare, T.MenteeCompletedSessions, 10),
  def('MENTEE_LEARNING_STREAK', 'Learning Streak', 'Maintain learning activity for 4 consecutive weeks', E, R.Rare, T.MenteeConsecutiveWeeks, 4),
  def('MENTEE_UNSTOPPABLE', 'Unstoppable', 'Maintain learning activity for 12 consecutive weeks', E, R.Epic, T.MenteeConsecutiveWeeks, 12),
  def('MENTEE_GOAL_GETTER', 'Goal Getter', 'Complete 1 learning goal', E, R.Common, T.MenteeCompletedGoals, 1),
  def('MENTEE_GOAL_CRUSHER', 'Goal Crusher', 'Complete 10 learning goals', E, R.Epic, T.MenteeCompletedGoals, 10),
  def('MENTEE_COURSE_GRADUATE', 'Course Graduate', 'Complete 1 course', E, R.Uncommon, T.MenteeCompletedCourses, 1),
  def('MENTEE_KNOWLEDGE_COLLECTOR', 'Knowledge Collector', 'Complete 5 courses', E, R.Rare, T.MenteeCompletedCourses, 5),
  def('MENTEE_CURIOUS_MIND', 'Curious Mind', 'Actively participate in 5 mentorship sessions', E, R.Uncommon, T.MenteeReviewedSessions, 5),
  def('MENTEE_CONNECTED_LEARNER', 'Connected Learner', 'Complete sessions with 5 different mentors', E, R.Rare, T.MenteeUniqueMentors, 5),
  def('MENTEE_GREAT_MENTEE', 'Great Mentee', 'Receive positive feedback from a mentor', E, R.Uncommon, T.MenteePositiveMentorFeedback, 1),
  def('MENTEE_COMMUNITY_LEARNER', 'Community Learner', 'Attend 1 GuroKonekt event', E, R.Common, T.MenteeEventsAttended, 1),
  def('MENTEE_COMMUNITY_EXPLORER', 'Community Explorer', 'Attend 5 GuroKonekt events', E, R.Rare, T.MenteeEventsAttended, 5),
  def('MENTEE_KONEKT_SCHOLAR', 'Konekt Scholar', 'Complete 50 mentorship sessions', E, R.Legendary, T.MenteeCompletedSessions, 50),
  // Special (admin-awarded)
  def('SPECIAL_FOUNDING_MENTOR', 'Founding Mentor', 'One of the original mentors of GuroKonekt', S, R.Legendary, T.Manual, 1),
  def('SPECIAL_FOUNDING_MENTEE', 'Founding Mentee', 'One of the original learners of GuroKonekt', S, R.Legendary, T.Manual, 1),
  def('SPECIAL_COMMUNITY_LEADER', 'Community Leader', 'Recognized leader within the GuroKonekt community', S, R.Epic, T.Manual, 1),
  def('SPECIAL_VOLUNTEER', 'Volunteer', 'Contributed time to GuroKonekt initiatives', S, R.Rare, T.Manual, 1),
  def('SPECIAL_OFFICIAL_SPEAKER', 'Official Speaker', 'Official speaker at a GuroKonekt event', S, R.Epic, T.Manual, 1),
  def('SPECIAL_GUROKONEKT_CONTRIBUTOR', 'GuroKonekt Contributor', 'Made a significant contribution to the platform or community', S, R.Epic, T.Manual, 1),
];

export interface BadgeInterface {
  id: string;
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirementType: string;
  requirementValue: number;
  active: boolean;
}

/** Admin list row. */
export interface AdminBadgeInterface extends BadgeInterface {
  unlockedCount: number;
}

/** One badge as the user sees it: locked with progress, or unlocked with a date. */
export interface UserBadgeInterface {
  badgeId: string;
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirementType: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt: Date | null;
  featured: boolean;
}

export interface UserAchievementsInterface {
  unlockedCount: number;
  totalCount: number;
  featured: UserBadgeInterface[];
  badges: UserBadgeInterface[];
}

/** Shown on public profiles. */
export interface FeaturedBadgeInterface {
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  unlockedAt: Date | null;
}
