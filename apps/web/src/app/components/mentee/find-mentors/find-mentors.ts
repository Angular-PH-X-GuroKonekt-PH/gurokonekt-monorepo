import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Pagination } from '@gurokonekt/ui';
import { catchError, map, Observable, of, shareReplay, startWith, switchMap } from 'rxjs';

import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

import {
  AvailabilityOption,
  FlatMentorCard,
  MentorSearchFilter,
  MentorSearchItemInterface,
  MentorSearchResultInterface,
  SearchSortBy,
  SearchSortOrder,
} from '@gurokonekt/models/interfaces/search/search.model';

import { MentorSearchService } from '../../../services/mentor-search.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { MentorCard } from '../../shared/mentor-card/mentor-card';
import { MentorSearch } from '../../shared/mentor-search/mentor-search';
import { MentorService } from '../../../services/mentor.service';
import { RecommendedMentorCard } from '../../shared/recommended-mentor-card/recommended-mentor-card';
import { SectionCard } from '../../shared/section-card/section-card';
import { SectionTitle } from '../../shared/section-title/section-title';
import { MentorCardSkeleton } from '../../shared/mentor-card-skeleton/mentor-card-skeleton';

type FindMentorsViewModel = {
  cards: FlatMentorCard[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  hasSearched: boolean;
  error: string | null;
};

type SearchProfileWithDisplayMeta =
  MentorSearchItemInterface['mentorProfiles'][number] & {
    rating?: number;
    reviewCount?: number;
  };

function toFlatCard(item: MentorSearchItemInterface): FlatMentorCard {
  const profile = item.mentorProfiles?.[0] as
    | SearchProfileWithDisplayMeta
    | undefined;
  const name = [item.firstName, item.middleName, item.lastName]
    .filter(Boolean)
    .join(' ');
  const expertise = profile?.areasOfExpertise ?? [];
  const skills = profile?.skills ?? [];
  const bio = profile?.bio?.trim() || '';
  const tagline = expertise[0] || skills[0] || bio.split('.')[0] || 'Mentor';

  return {
    id: item.id,
    fullName: name || 'Unnamed mentor',
    avatarUrl: item.avatarAttachments?.[0]?.publicUrl ?? '',
    bio,
    tagline,
    skills,
    expertise,
    rating: profile?.rating ?? 0,
    reviewCount: profile?.reviewCount ?? 0,
    availability: normalizeAvailability(profile?.availability),
    sessionRate: profile?.sessionRate ?? null,
    yearsOfExperience: profile?.yearsOfExperience ?? null,
  };
}

function normalizeAvailability(
  availability: unknown
): UserAvailabilityInterface[] {
  return Array.isArray(availability)
    ? (availability as UserAvailabilityInterface[])
    : [];
}

@Component({ 
  selector: 'app-find-mentors',
  imports: [CommonModule, SectionCard, SectionTitle, MentorSearch, Pagination, MentorCard, IconComponent, RecommendedMentorCard, MentorCardSkeleton],
  templateUrl: './find-mentors.html',
  styleUrl: './find-mentors.scss',
})
export class FindMentors {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mentorSearchService = inject(MentorSearchService);
  private readonly mentorService = inject(MentorService);
  protected readonly currentMentorSlide = signal(0);

  protected readonly vm$ = this.route.queryParams.pipe(
    switchMap((params) => {
      if (Object.keys(params).length === 0) {
        return of(
          this.buildViewModel(this.buildEmptySearchResult(), {
            hasSearched: false,
          })
        );
      }

      const filters = this.buildFiltersFromParams(params);

      return this.mentorSearchService.searchMentors(filters).pipe(
        map((response) =>
          this.buildViewModel(response, {
            hasSearched: true,
          })
        ),
        startWith(this.buildLoadingViewModel(filters)),
        catchError((error) =>
          of(
            this.buildViewModel(this.buildEmptySearchResult(filters), {
              hasSearched: true,
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to load mentors. Please try again.',
            })
          )
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  protected onPageChange(page: number, currentPage: number): void {
    if (page === currentPage) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  private buildFiltersFromParams(
    params: Record<string, unknown>
  ): MentorSearchFilter {
    const page = this.parsePositiveNumber(params['page'], 1);
    const limit = this.parsePositiveNumber(params['limit'], 10);

    return {
      name: typeof params['name'] === 'string' ? params['name'] : null,
      skills:
        typeof params['skills'] === 'string'
          ? params['skills'].split(',').filter(Boolean)
          : [],
      expertise:
        typeof params['expertise'] === 'string'
          ? params['expertise'].split(',').filter(Boolean)
          : [],
      minRating:
        params['minRating'] != null ? Number(params['minRating']) : null,
      availability:
        typeof params['availability'] === 'string'
          ? (params['availability'] as AvailabilityOption)
          : null,
      minSessionRate:
        params['minSessionRate'] != null
          ? Number(params['minSessionRate'])
          : null,
      maxSessionRate:
        params['maxSessionRate'] != null
          ? Number(params['maxSessionRate'])
          : null,
      minYearsExperience:
        params['minYearsExperience'] != null
          ? Number(params['minYearsExperience'])
          : null,
      sortBy:
        typeof params['sortBy'] === 'string'
          ? (params['sortBy'] as SearchSortBy)
          : null,
      sortOrder:
        typeof params['sortOrder'] === 'string'
          ? (params['sortOrder'] as SearchSortOrder)
          : SearchSortOrder.DESC,
      page,
      limit,
    };
  }

  private parsePositiveNumber(value: unknown, fallback: number): number {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue) || parsedValue < 1) {
      return fallback;
    }

    return Math.floor(parsedValue);
  }

  private buildLoadingViewModel(
    filters: MentorSearchFilter
  ): FindMentorsViewModel {
    return {
      ...this.buildViewModel(this.buildEmptySearchResult(filters), {
        hasSearched: true,
      }),
      isLoading: true,
    };
  }

  private buildViewModel(
    response: MentorSearchResultInterface,
    options: { hasSearched: boolean; error?: string | null }
  ): FindMentorsViewModel {
    return {
      cards: response.results.map(toFlatCard),
      totalCount: response.total,
      currentPage: response.page,
      pageSize: response.limit,
      isLoading: false,
      hasSearched: options.hasSearched,
      error: options.error ?? null,
    };
  }

  private buildEmptySearchResult(
    filters: Partial<MentorSearchFilter> = {}
  ): MentorSearchResultInterface {
    return {
      total: 0,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      results: [],
    };
  }

  protected readonly recommendedMentors$: Observable<MentorSearchItemInterface[]> =
    this.mentorService.getRecommendedMentors(6);

  
  protected nextMentorSlide(totalSlides: number): void {
    if (totalSlides <= 0) {
      return;
    }

    this.currentMentorSlide.update((currentSlide) =>
      currentSlide >= totalSlides ? 0 : currentSlide + 1
    );
  }

  protected previousMentorSlide(totalSlides: number): void {
    if (totalSlides <= 0) {
      return;
    }

    this.currentMentorSlide.update((currentSlide) =>
      currentSlide === 0 ? totalSlides : currentSlide - 1
    );
  }

  protected setMentorSlide(index: number): void {
    this.currentMentorSlide.set(index);
  }



  protected getMaxMentorSlide(totalMentors: number): number {
    return Math.max(totalMentors - 3, 0);
  }

  protected getMentorSlideIndexes(totalMentors: number): number[] {
    return Array.from(
      { length: this.getMaxMentorSlide(totalMentors) + 1 },
      (_, index) => index
    );
  }

}
