import { AvailabilityOverrideInterface, UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

export interface AvailabilityStateModel {
  availabilities: UserAvailabilityInterface[];
  sessionDurationMinutes: number;
  availabilityTimezone: string;
  availabilityOverrides: AvailabilityOverrideInterface[];
  isLoading: boolean;
  errorMessage: string | null;
}

export const initialAvailabilityState: AvailabilityStateModel = {
  availabilities: [],
  sessionDurationMinutes: 60,
  availabilityTimezone: 'UTC',
  availabilityOverrides: [],
  isLoading: false,
  errorMessage: null,
};
