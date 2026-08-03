import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { APP_CONFIG } from '../../../../environments/app-config.token';

/**
 * A mentor as returned by the public Featured Mentors endpoint.
 *
 * Declared locally rather than imported from `@gurokonekt/models` so this app
 * builds independently of the API branch that adds `FeaturedMentorInterface`
 * (#346). Swap this for the shared type once #346 is merged.
 */
export interface FeaturedMentor {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  bio: string | null;
  areasOfExpertise: string[];
  skills: string[];
  avatarUrl: string | null;
  /** Mean of all mentee ratings, rounded to one decimal. `null` when unrated. */
  averageRating: number | null;
  ratingCount: number;
}

interface FeaturedMentorsResponse {
  data?: FeaturedMentor[] | null;
}

export const FEATURED_MENTORS_HERO_COUNT = 2;

@Injectable({ providedIn: 'root' })
export class FeaturedMentors {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);

  /**
   * Fetches featured mentors for the public site.
   *
   * Never errors: any failure resolves to an empty array so callers have a
   * single "nothing to show" branch instead of separate empty and error states.
   * The hero relies on this — a backend outage degrades to the static image
   * rather than breaking the marketing page.
   */
  getFeaturedMentors(
    limit: number = FEATURED_MENTORS_HERO_COUNT,
  ): Observable<FeaturedMentor[]> {
    return this.http
      .get<FeaturedMentorsResponse>(
        `${this.appConfig.API_URL}/public/mentors/featured`,
        { params: { limit } },
      )
      .pipe(
        map((response) => response?.data ?? []),
        catchError(() => of<FeaturedMentor[]>([])),
      );
  }
}
