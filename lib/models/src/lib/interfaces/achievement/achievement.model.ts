/**
 * Mentor achievement badges (issue #419).
 *
 * Kept free of NestJS / class-validator imports so the Angular apps can
 * deep-import it: `@gurokonekt/models/interfaces/achievement/achievement.model`.
 */

export enum AchievementAwardType {
  /** Granted by the system when the mentor meets every criterion. */
  Automatic = 'automatic',
  /** The mentor applies (optionally with proof); an admin reviews unless auto-approve is on. */
  Application = 'application',
}

export enum MentorAchievementStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Expired = 'expired',
  Revoked = 'revoked',
}

/** Platform numbers an automatic achievement can be based on. */
export enum AchievementMetric {
  CompletedSessions = 'completed_sessions',
  AverageRating = 'average_rating',
  ReviewCount = 'review_count',
  YearsOfExperience = 'years_of_experience',
}

export const ACHIEVEMENT_METRICS: Record<AchievementMetric, { label: string; unit: string; step: number }> = {
  [AchievementMetric.CompletedSessions]: { label: 'Completed sessions', unit: 'sessions', step: 1 },
  [AchievementMetric.AverageRating]: { label: 'Average rating', unit: 'stars', step: 0.1 },
  [AchievementMetric.ReviewCount]: { label: 'Number of reviews', unit: 'reviews', step: 1 },
  [AchievementMetric.YearsOfExperience]: { label: 'Years of experience', unit: 'years', step: 1 },
};

/** Badge icons admins can pick from. Emoji render the same in every app. */
export const ACHIEVEMENT_ICONS = ['🏆', '🎖️', '⭐', '🏅', '🎓', '📜', '🛡️', '🚀', '💎', '🔥', '💡', '🤝'] as const;

/** Badge colours admins can pick from; each app maps the key to its own classes. */
export const ACHIEVEMENT_COLORS = ['amber', 'blue', 'green', 'purple', 'rose', 'slate'] as const;
export type AchievementColor = (typeof ACHIEVEMENT_COLORS)[number];

/** Proof upload rules for application achievements. */
export const ACHIEVEMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
export const ACHIEVEMENT_PROOF_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

export interface AchievementCriterion {
  metric: AchievementMetric;
  min: number;
}

/** An achievement in the catalog (Admin Portal / mentor settings). */
export interface AchievementInterface {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: AchievementColor | string;
  awardType: AchievementAwardType;
  requirements: string | null;
  requiresProof: boolean;
  autoApprove: boolean;
  criteria: AchievementCriterion[];
  validityMonths: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Admin catalog row: the achievement plus how many mentors hold or await it. */
export interface AdminAchievementInterface extends AchievementInterface {
  holderCount: number;
  pendingCount: number;
}

/** A badge as shown to mentees (cards, profile, landing page). */
export interface MentorBadgeInterface {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  awardedAt: string | null;
  expiresAt: string | null;
}

/** A mentor's own application / badge for one achievement. */
export interface MentorAchievementInterface {
  id: string;
  achievementId: string;
  status: MentorAchievementStatus;
  details: string | null;
  earnedAt: string | null;
  awardedAt: string | null;
  expiresAt: string | null;
  proofFileName: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  updatedAt: string;
}

/** Mentor settings: a catalog entry, the mentor's progress, and their record (if any). */
export interface MentorAchievementCatalogItem {
  achievement: AchievementInterface;
  mine: MentorAchievementInterface | null;
  /** Automatic achievements: the mentor's current value for each criterion. */
  progress: { metric: AchievementMetric; current: number; min: number; met: boolean }[];
}

/** Admin review queue row. */
export interface AdminAchievementSubmissionInterface extends MentorAchievementInterface {
  achievement: Pick<AchievementInterface, 'id' | 'name' | 'icon' | 'color' | 'awardType' | 'requiresProof'>;
  mentor: { id: string; firstName: string; lastName: string; email: string };
  hasProof: boolean;
}

/** Row shape returned by `SelectFields.getActiveBadgesSelect()`. */
export interface ActiveBadgeRow {
  awardedAt: Date | string | null;
  expiresAt: Date | string | null;
  achievement: { id: string; name: string; icon: string; color: string; description: string };
}

const toIso = (value: Date | string | null): string | null =>
  value === null ? null : value instanceof Date ? value.toISOString() : value;

/** Flattens active-badge rows into the shape every app displays. */
export function toMentorBadges(rows: ActiveBadgeRow[] | null | undefined): MentorBadgeInterface[] {
  return (rows ?? []).map((row) => ({
    id: row.achievement.id,
    name: row.achievement.name,
    icon: row.achievement.icon,
    color: row.achievement.color,
    description: row.achievement.description,
    awardedAt: toIso(row.awardedAt),
    expiresAt: toIso(row.expiresAt),
  }));
}
