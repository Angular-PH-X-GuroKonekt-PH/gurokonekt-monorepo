import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Pagination } from '@gurokonekt/ui';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import {
  AvailabilityOption,
  MentorSearchFilter,
  MentorSearchItemInterface,
  MentorSearchResultInterface,
} from '@gurokonekt/models/interfaces/search/search.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { MentorCardListSkeleton } from '../../components/mentor-card-list-skeleton/mentor-card-list-skeleton.component';
import { MenteeSearchMentorService } from '../../services/mentee-search-mentor.service';
import { MentorInfoCard } from '../../components/mentor-info-card/mentor-info-card';
import { MentorRecommendations } from '../../components/mentor-recommendations/mentor-recommendations';
import { MentorSearch } from '../../components/mentor-search/mentor-search';
import {
  FindMentorsSearchState,
  RecommendedMentorsState,
} from '../../interfaces/search-mentor.interface';

// Query params that constitute an active search. When any is present the
// recommended row is hidden so results get the full page.
const FILTER_QUERY_PARAMS = [
  'name',
  'skills',
  'expertise',
  'availabilityDay',
  'language',
  'minYearsExperience',
  'maxYearsExperience',
] as const;

@Component({
  selector: 'app-mentee-find-mentors-page',
  standalone: true,
  imports: [
    MentorSearch,
    Pagination,
    IconComponent,
    MentorCardListSkeleton,
    MentorInfoCard,
    MentorRecommendations,
  ],
  templateUrl: './mentee-find-mentors.page.html',
})
export class MenteeFindMentorsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly menteeSearchMentorService = inject(MenteeSearchMentorService);

  protected readonly searchState = toSignal(
    this.route.queryParams.pipe(
      switchMap((params) => {
        const filters = this.buildFiltersFromParams(params);

        return this.menteeSearchMentorService.searchMentors(filters).pipe(
          map((response) => this.buildSearchState(response)),
          startWith(this.buildLoadingSearchState(filters)),
          catchError((error) =>
            of(
              this.buildSearchState(
                this.buildEmptySearchResult(filters),
                error instanceof Error
                  ? error.message
                  : 'Unable to load mentors. Please try again.'
              )
            )
          )
        );
      })
    ),
    {
      initialValue: this.buildLoadingSearchState(
        this.buildFiltersFromParams(this.route.snapshot.queryParams)
      ),
    }
  );

  // Fetched once on init and deliberately NOT derived from queryParams — paging or
  // filtering the main list must not refetch or disturb the recommended row.
  protected readonly recommendedState = toSignal(
    this.menteeSearchMentorService.getRecommendedMentors().pipe(
      map((response) => this.buildRecommendedState(response.results, response.isPersonalized)),
      startWith(this.buildLoadingRecommendedState()),
      catchError((error) =>
        of(
          this.buildRecommendedState(
            [],
            false,
            error instanceof Error
              ? error.message
              : 'Unable to load recommendations. Please try again.'
          )
        )
      )
    ),
    { initialValue: this.buildLoadingRecommendedState() }
  );

  private readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  protected readonly hasActiveFilters = computed(() => {
    const params = this.queryParams();

    return FILTER_QUERY_PARAMS.some((key) => {
      const value = params[key];
      return typeof value === 'string' && value.trim().length > 0;
    });
  });

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
      availabilityDay:
        typeof params['availabilityDay'] === 'string'
          ? this.parseAvailabilityDays(params['availabilityDay'])
          : [],
      language:
        typeof params['language'] === 'string' ? params['language'] : null,
      minYearsExperience: this.parseOptionalPositiveNumber(
        params['minYearsExperience']
      ),
      maxYearsExperience: this.parseOptionalPositiveNumber(
        params['maxYearsExperience']
      ),
      minRating: this.parseOptionalPositiveNumber(params['minRating']),
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

  private parseOptionalPositiveNumber(value: unknown): number | null {
    if (value == null) {
      return null;
    }

    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      return null;
    }

    return Math.floor(parsedValue);
  }

  private parseAvailabilityDays(value: string): AvailabilityOption[] {
    return value
      .split(',')
      .map((day) => day.trim())
      .filter(Boolean) as AvailabilityOption[];
  }

  private buildLoadingSearchState(
    filters: MentorSearchFilter
  ): FindMentorsSearchState {
    return {
      ...this.buildSearchState(this.buildEmptySearchResult(filters)),
      isLoading: true,
    };
  }

  private buildSearchState(
    response: MentorSearchResultInterface,
    error: string | null = null
  ): FindMentorsSearchState {
    return {
      mentors: response.results,
      totalCount: response.total,
      currentPage: response.page,
      pageSize: response.limit,
      isLoading: false,
      error,
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

  private buildLoadingRecommendedState(): RecommendedMentorsState {
    return { ...this.buildRecommendedState([], false), isLoading: true };
  }

  private buildRecommendedState(
    mentors: MentorSearchItemInterface[],
    isPersonalized: boolean,
    error: string | null = null
  ): RecommendedMentorsState {
    return { mentors, isPersonalized, isLoading: false, error };
  }
}
