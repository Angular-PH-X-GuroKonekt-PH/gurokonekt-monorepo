import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import { APP_ROUTES } from '../../../../shared/constants/routes';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { getCountryDisplayName } from '../../../../shared/utils/location-data.util';
import { getLanguageLabel } from '../../../../shared/utils';
import { MentorService } from '../../../mentor/services/mentor.service';
import { MenteePageLoader } from '../../components/mentee-page-loader/mentee-page-loader';
import { MentorProfileHero } from '../../components/mentor-profile-hero/mentor-profile-hero';
import {
  formatDayLabel,
  formatTimeTo12Hour,
} from '../../utils/mentor-availability.util';
import { ReviewService } from '../../services/review.service';
import { REVIEW_DEFAULT_LIMIT } from '../../constants/review.constants';

type MentorProfileTab = 'overview' | 'reviews';
type ReviewStar = {
  index: number;
  isFilled: boolean;
};

@Component({
  selector: 'app-mentee-mentor-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    MenteePageLoader,
    MentorProfileHero,
    RouterLink,
  ],
  templateUrl: './mentee-mentor-profile.page.html',
})
export class MenteeMentorProfilePage {
  private readonly previewLimit = 5;
  private readonly route = inject(ActivatedRoute);
  private readonly mentorService = inject(MentorService);
  private readonly reviewService = inject(ReviewService);

  protected readonly bookSessionRoute = APP_ROUTES.BOOK_SESSION;
  protected readonly findMentorsRoute = APP_ROUTES.FIND_MENTORS;
  protected readonly activeTab = signal<MentorProfileTab>('overview');

  protected readonly mentorId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('mentorId') ?? '')),
    { initialValue: '' }
  );

  protected readonly mentor = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('mentorId') ?? ''),
      switchMap((mentorId) => this.mentorService.getMentorProfileById(mentorId))
    ),
    { initialValue: null }
  );

  protected readonly mentorFullName = computed(() => {
    const mentor = this.mentor();

    if (!mentor) {
      return 'Mentor';
    }

    return [mentor.user.firstName, mentor.user.lastName]
      .filter(Boolean)
      .join(' ');
  });

  protected readonly mentorReviews = toSignal(
    toObservable(this.mentorId).pipe(
      switchMap((mentorId) => {
        if (!mentorId) {
          return of(null);
        }

        return this.reviewService.getReviewsByMentor(
          mentorId,
          REVIEW_DEFAULT_LIMIT
        );
      })
    ),
    { initialValue: null }
  );

  protected readonly reviews = computed(() => this.mentorReviews()?.data ?? []);

  protected readonly averageRating = computed(
    () => this.mentorReviews()?.averageRating ?? null
  );

  protected readonly ratingCount = computed(
    () => this.mentorReviews()?.ratingCount ?? 0
  );

  protected readonly reviewSummaryStars = computed<ReviewStar[]>(() => {
    const filledStars = Math.round(this.averageRating() ?? 0);

    return Array.from({ length: 5 }, (_, index) => ({
      index,
      isFilled: index < filledStars,
    }));
  });

  protected readonly formattedAverageRating = computed(() => {
    const rating = this.averageRating() ?? 0;

    return Number.isInteger(rating) ? `${rating}` : rating.toFixed(1);
  });

  protected readonly reviewCountLabel = computed(() => {
    const count = this.ratingCount();

    return `${count} ${count === 1 ? 'Review' : 'Reviews'}`;
  });

  protected readonly ratingBreakdown = computed(() => {
    const reviews = this.reviews();
    const totalReviews = reviews.length;

    return [5, 4, 3, 2, 1].map((rating) => {
      const count = reviews.filter(
        (review) => Math.round(review.rating) === rating
      ).length;

      return {
        rating,
        count,
        percentage: totalReviews ? Math.round((count / totalReviews) * 100) : 0,
      };
    });
  });

  protected readonly completedSessionCount = computed(() => this.ratingCount());

  protected readonly displayedSkills = computed(
    () => this.mentor()?.skills.slice(0, this.previewLimit) ?? []
  );

  protected readonly skillsCount = computed(
    () => this.mentor()?.skills.length ?? 0
  );

  protected readonly remainingSkillsCount = computed(() =>
    Math.max(this.skillsCount() - this.previewLimit, 0)
  );

  private readonly availableExpertise = computed(() => {
    const mentor = this.mentor();

    if (!mentor) {
      return [];
    }

    const skillNames = new Set(
      mentor.skills.map((skill) => this.normalizeProfileTag(skill))
    );

    return mentor.areasOfExpertise.filter(
      (expertise) => !skillNames.has(this.normalizeProfileTag(expertise))
    );
  });

  protected readonly expertiseCount = computed(
    () => this.availableExpertise().length
  );

  protected readonly displayedExpertise = computed(
    () => this.availableExpertise().slice(0, this.previewLimit)
  );

  protected readonly remainingExpertiseCount = computed(() =>
    Math.max(this.expertiseCount() - this.previewLimit, 0)
  );

  protected getCountryLabel(country: string): string {
    return country ? getCountryDisplayName(country) : 'Country not listed';
  }

  protected getMentorLanguageLabel(language: string): string {
    return language ? getLanguageLabel(language) : 'Language not listed';
  }

  protected getAvailabilityDay(day: string): string {
    return formatDayLabel(day);
  }

  protected getAvailabilityTime(from: string, to: string): string {
    return `${formatTimeTo12Hour(from)} - ${formatTimeTo12Hour(to)}`;
  }

  protected selectTab(tab: MentorProfileTab): void {
    this.activeTab.set(tab);
  }

  protected getExperienceLabel(yearsOfExperience: number): string {
    if (!yearsOfExperience) {
      return 'Not listed';
    }

    return `${yearsOfExperience}+ ${yearsOfExperience === 1 ? 'year' : 'years'}`;
  }

  protected getReviewStars(rating: number): number[] {
    return Array.from({ length: Math.round(rating) });
  }

  private normalizeProfileTag(value: string): string {
    return value.trim().toLowerCase();
  }
}
