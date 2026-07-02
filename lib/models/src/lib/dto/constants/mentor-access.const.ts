import { UserRole, UserStatus } from '../../interfaces/user/user.model';

/** Minimal user fields required to decide whether a mentor is publicly available. */
export interface MentorAccessFields {
  role: UserRole | string;
  status: UserStatus | string;
  isMentorApproved: boolean;
  isMentorProfileComplete: boolean;
}

/**
 * Single source of truth for "an approved, publicly available mentor".
 *
 * A mentor is only surfaced to mentees (search, recommendations) and bookable
 * once an admin has approved them AND their profile is complete. This filter is
 * duplicated nowhere else — every mentee-facing mentor query must use it so the
 * criteria cannot drift (a past bug had search filtering on `status: 'active'`
 * while the approve flow wrote `status: 'approved'`).
 */
export class MentorAccess {
  /** Prisma `where` fragment matching an approved, available mentor. */
  static approvedMentorWhere() {
    return {
      role: UserRole.Mentor,
      status: UserStatus.Approved,
      isMentorApproved: true,
      isMentorProfileComplete: true,
    };
  }

  /** Predicate form of {@link approvedMentorWhere} for post-fetch validation. */
  static isApprovedMentor(user: MentorAccessFields | null | undefined): boolean {
    return (
      !!user &&
      user.role === UserRole.Mentor &&
      user.status === UserStatus.Approved &&
      user.isMentorApproved === true &&
      user.isMentorProfileComplete === true
    );
  }
}
