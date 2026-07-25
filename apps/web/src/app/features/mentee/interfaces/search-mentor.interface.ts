import { MentorSearchItemInterface } from '@gurokonekt/models/interfaces/search/search.model';

export type MentorSearchDropdown =
  | 'expertise'
  | 'skills'
  | 'availability'
  | 'experience'
  | 'language'
  | 'rating'
  | null;

export interface FindMentorsSearchState {
  mentors: MentorSearchItemInterface[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
}

export interface RecommendedMentorsState {
  mentors: MentorSearchItemInterface[];
  isPersonalized: boolean;
  isLoading: boolean;
  error: string | null;
}
