import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

export interface AvailabilityStateModel {
  availabilities: UserAvailabilityInterface[];
  sessionDurationMinutes: number;
  isLoading: boolean;
  errorMessage: string | null;
}

export const initialAvailabilityState: AvailabilityStateModel = {
  availabilities: [],
  sessionDurationMinutes: 60,
  isLoading: false,
  errorMessage: null,
};
