import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

import {
  CreateReviewRequest,
  ReviewInterface,
  ReviewListResponseInterface,
} from '@gurokonekt/models';

import { ApiResponse } from '../../../shared/interfaces/api-response.interface';
import { buildApiUrl } from '../../../shared/utils';
import {
  handleApiError,
  handleApiErrorWithFallback,
  validateApiResponse,
} from '../../../shared/helpers';
import { EMPTY_REVIEW_LIST } from '../constants/review.constants';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);

  createReview(request: CreateReviewRequest): Observable<ReviewInterface> {
    return this.http
      .post<ApiResponse<ReviewInterface>>(buildApiUrl('/reviews'), request)
      .pipe(
        map((response) => {
          if (response.status !== 'success' || !response.data) {
            throw {
              message: response.message || 'Failed to create review.',
              statusCode: response.statusCode || 500,
            };
          }

          return response.data;
        }),
        catchError(handleApiError),
      );
  }


  getReviewsByMentor(
    mentorId: string,
    limit = EMPTY_REVIEW_LIST.limit
  ): Observable<ReviewListResponseInterface> {
    return this.http
      .get<ApiResponse<ReviewListResponseInterface>>(
        buildApiUrl(`/reviews?mentorId=${mentorId}&page=1&limit=${limit}`)
      )
      .pipe(
        map((response) =>
          validateApiResponse<ReviewListResponseInterface>(
            response,
            'Failed to fetch reviews.'
          )
        ),
        catchError(
          handleApiErrorWithFallback(
            { ...EMPTY_REVIEW_LIST, limit },
            'Failed to fetch reviews'
          )
        )
      );
  }
}
