import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

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

  protected readonly bookSessionRoute = APP_ROUTES.BOOK_SESSION;
  protected readonly findMentorsRoute = APP_ROUTES.FIND_MENTORS;

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

  protected readonly displayedSkills = computed(
    () => this.mentor()?.skills.slice(0, this.previewLimit) ?? []
  );

  protected readonly remainingSkillsCount = computed(() =>
    Math.max((this.mentor()?.skills.length ?? 0) - this.previewLimit, 0)
  );

  protected readonly displayedExpertise = computed(
    () => this.mentor()?.areasOfExpertise.slice(0, this.previewLimit) ?? []
  );

  protected readonly remainingExpertiseCount = computed(() =>
    Math.max(
      (this.mentor()?.areasOfExpertise.length ?? 0) - this.previewLimit,
      0
    )
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

  protected getExperienceLabel(yearsOfExperience: number): string {
    if (!yearsOfExperience) {
      return 'Not listed';
    }

    return `${yearsOfExperience}+ ${
      yearsOfExperience === 1 ? 'year' : 'years'
    } experience`;
  }
}
