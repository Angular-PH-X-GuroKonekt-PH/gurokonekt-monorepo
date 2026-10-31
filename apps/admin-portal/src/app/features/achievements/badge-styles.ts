import {
  ACHIEVEMENT_METRICS,
  AchievementCriterion,
  MentorAchievementStatus,
} from '@gurokonekt/models/interfaces/achievement/achievement.model';

/** Full class strings (not built dynamically) so Tailwind keeps them. */
export const BADGE_COLOR_CLASSES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  green: 'bg-green-50 text-green-800 border-green-200',
  purple: 'bg-purple-50 text-purple-800 border-purple-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const badgeClasses = (color: string): string => BADGE_COLOR_CLASSES[color] ?? BADGE_COLOR_CLASSES['slate'];

export const STATUS_LABELS: Record<MentorAchievementStatus, { label: string; classes: string }> = {
  [MentorAchievementStatus.Pending]: { label: 'Waiting for review', classes: 'bg-yellow-100 text-yellow-800' },
  [MentorAchievementStatus.Approved]: { label: 'Approved', classes: 'bg-green-100 text-green-800' },
  [MentorAchievementStatus.Rejected]: { label: 'Rejected', classes: 'bg-red-100 text-red-800' },
  [MentorAchievementStatus.Expired]: { label: 'Expired', classes: 'bg-gray-100 text-gray-600' },
  [MentorAchievementStatus.Revoked]: { label: 'Revoked', classes: 'bg-gray-200 text-gray-700' },
};

/** "50+ completed sessions and 4.5+ average rating" */
export const describeCriteria = (criteria: AchievementCriterion[]): string =>
  criteria
    .map((c) => `${c.min}+ ${ACHIEVEMENT_METRICS[c.metric]?.label.toLowerCase() ?? c.metric}`)
    .join(' and ');

export const formatDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
