import { AvailabilityOption } from '@gurokonekt/models/interfaces/search/search.model';
import { DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';

export const MENTOR_SEARCH_EXPERIENCE_OPTIONS = [
  { label: 'All', min: null, max: null },
  { label: '0-2 years', min: 0, max: 2 },
  { label: '3-5 years', min: 3, max: 5 },
  { label: '6-10 years', min: 6, max: 10 },
  { label: '10+ years', min: 10, max: null },
];

export const MENTOR_SEARCH_RATING_OPTIONS = [
  { label: 'All', value: null },
  { label: '5 stars', value: 5 },
  { label: '4 stars & up', value: 4 },
  { label: '3 stars & up', value: 3 },
  { label: '2 stars & up', value: 2 },
];

export const MENTOR_SEARCH_AVAILABILITY_OPTIONS: {
  label: string;
  value: AvailabilityOption | null;
}[] = [
  { label: 'Monday', value: DaysInWeek.Monday },
  { label: 'Tuesday', value: DaysInWeek.Tuesday },
  { label: 'Wednesday', value: DaysInWeek.Wednesday },
  { label: 'Thursday', value: DaysInWeek.Thursday },
  { label: 'Friday', value: DaysInWeek.Friday },
  { label: 'Saturday', value: DaysInWeek.Saturday },
  { label: 'Sunday', value: DaysInWeek.Sunday }
];
