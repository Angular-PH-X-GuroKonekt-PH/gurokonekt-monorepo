import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
import { MentorCardListSkeleton } from '../../../../shared/components/loaders/mentor-card-list-skeleton/mentor-card-list-skeleton';
import { MentorSearchService } from '../../../mentor/services/mentor-search.service';
import { MentorService } from '../../../mentor/services/mentor.service';
import { RecommendedMentorCard } from '../../../mentor/components/recommended-mentor-card/recommended-mentor-card';
import { SectionCard } from '../../../../shared/components/section-card/section-card';
import { SectionTitle } from '../../../../shared/components/section-title/section-title';
import { MentorInfoCard } from '../../../mentor/components/mentor-info-card/mentor-info-card';
import { MentorSearch } from '../../../mentor/components/mentor-search/mentor-search';



type FindMentorsViewModel = {
  mentors: MentorSearchItemInterface[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  hasSearched: boolean;
  error: string | null;
};

@Component({ 
  selector: 'app-mentee-find-mentors-page',
  standalone: true,
  imports: [
    CommonModule,
    SectionCard,
    SectionTitle,
    MentorSearch,
    Pagination,
    IconComponent,
    RecommendedMentorCard,
    MentorCardListSkeleton,
    MentorInfoCard,
  ],
  templateUrl: './find-mentors.html',
  styleUrl: './find-mentors.scss',
})
export class MenteeFindMentorsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mentorSearchService = inject(MentorSearchService);
  private readonly mentorService = inject(MentorService);
  protected readonly currentMentorSlide = signal(0);

  protected readonly vm = toSignal(
    this.route.queryParams.pipe(
      switchMap((params) => {
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
      })
    ),
    {
      initialValue: this.buildLoadingViewModel(
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
      mentors: response.results,
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

  protected readonly recommendedMentors = toSignal<
    MentorSearchItemInterface[] | null
  >(this.mentorService.getRecommendedMentors(6), { initialValue: null });

  
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
