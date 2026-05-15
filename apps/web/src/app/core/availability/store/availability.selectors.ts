import { Selector } from '@ngxs/store';
import { AvailabilityState } from './availability.state';
import { AvailabilityStateModel } from '../models/availability.state.model';

export class AvailabilitySelectors {
  @Selector([AvailabilityState])
  static availabilities(state: AvailabilityStateModel) {
    return state.availabilities;
  }

  @Selector([AvailabilityState])
  static sessionDurationMinutes(state: AvailabilityStateModel) {
    return state.sessionDurationMinutes;
  }

  @Selector([AvailabilityState])
  static isLoading(state: AvailabilityStateModel) {
    return state.isLoading;
  }

  @Selector([AvailabilityState])
  static errorMessage(state: AvailabilityStateModel) {
    return state.errorMessage;
  }
}
