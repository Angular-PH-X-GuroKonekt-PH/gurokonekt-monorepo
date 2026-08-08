
import { ReviewListResponseInterface } from '@gurokonekt/models';

export const REVIEW_RATING_OPTIONS = [1, 2, 3, 4, 5] as const;  

export const REVIEW_DEFAULT_PAGE = 1;
export const REVIEW_DEFAULT_LIMIT = 5;
export const REVIEW_MAX_LENGTH = 1000;

export const EMPTY_REVIEW_LIST : ReviewListResponseInterface = {
  data: [],
  total: 0,
  page: REVIEW_DEFAULT_PAGE,
  limit: REVIEW_DEFAULT_LIMIT,
  totalPages: 1,
  averageRating: null,
  ratingCount: 0
};

