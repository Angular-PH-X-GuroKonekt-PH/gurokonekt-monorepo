import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Pagination } from '@gurokonekt/ui';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import {
  AvailabilityOption,
  MentorSearchFilter,
  MentorSearchResultInterface,
} from '@gurokonekt/models/interfaces/search/search.model';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { MentorCardListSkeleton } from '../../components/mentor-card-list-skeleton/mentor-card-list-skeleton.component';
import { MenteeSearchMentorService } from '../../services/mentee-search-mentor.service';
import { MentorInfoCard } from '../../components/mentor-info-card/mentor-info-card';
import { MentorSearch } from '../../components/mentor-search/mentor-search';
import { FindMentorsSearchState } from '../../interfaces/search-mentor.interface';

@Component({
  selector: 'app-mentee-find-mentors-page',
  standalone: true,
  imports: [
    MentorSearch,
    Pagination,
    IconComponent,
    MentorCardListSkeleton,
    MentorInfoCard,
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
          ? (params['availabilityDay'] as AvailabilityOption)
          : null,
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
}
