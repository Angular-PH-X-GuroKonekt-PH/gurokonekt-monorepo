import { Injectable, inject } from '@angular/core';
import { State, Action, StateContext } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AvailabilityService } from '../../../features/mentor/services/availability.service';
import { AvailabilityStateModel, initialAvailabilityState } from '../models/availability.state.model';
import * as AvailabilityActions from './availability.actions';

@State<AvailabilityStateModel>({
  name: 'availability',
  defaults: initialAvailabilityState,
})
@Injectable()
export class AvailabilityState {
  private readonly availabilityService = inject(AvailabilityService);

  @Action(AvailabilityActions.FetchAvailability)
  fetchAvailability(
    ctx: StateContext<AvailabilityStateModel>,
    action: AvailabilityActions.FetchAvailability
  ) {
    ctx.patchState({ isLoading: true, errorMessage: null });

    return this.availabilityService.getAvailability(action.userId).pipe(
      tap(({ availabilities, sessionDurationMinutes }) => {
        ctx.dispatch(
          new AvailabilityActions.FetchAvailabilitySuccess({ availabilities, sessionDurationMinutes })
        );
      }),
      catchError((error) => {
        ctx.dispatch(
          new AvailabilityActions.FetchAvailabilityFailure(
            error?.message || 'Failed to load availability'
          )
        );
        return throwError(() => error);
      })
    );
  }

  @Action(AvailabilityActions.FetchAvailabilitySuccess)
  fetchAvailabilitySuccess(
    ctx: StateContext<AvailabilityStateModel>,
    action: AvailabilityActions.FetchAvailabilitySuccess
  ) {
    ctx.patchState({
      availabilities: action.payload.availabilities,
      sessionDurationMinutes: action.payload.sessionDurationMinutes,
      isLoading: false,
      errorMessage: null,
    });
  }

  @Action(AvailabilityActions.FetchAvailabilityFailure)
  fetchAvailabilityFailure(
    ctx: StateContext<AvailabilityStateModel>,
    action: AvailabilityActions.FetchAvailabilityFailure
  ) {
    ctx.patchState({ errorMessage: action.error, isLoading: false });
  }
}
