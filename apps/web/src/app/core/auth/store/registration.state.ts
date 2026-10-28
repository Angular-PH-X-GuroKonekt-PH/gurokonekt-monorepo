import { Injectable } from '@angular/core';
import { State, Action, StateContext, NgxsOnInit } from '@ngxs/store';
import {
  GoogleRegistrationContext,
  RegistrationStateModel,
  initialRegistrationState,
} from '../models/registration.state.model';
import * as RegistrationActions from '../../auth/store/registration.actions';

// Session storage, not local storage: an unfinished Google sign-up should
// survive a refresh of the form, but not outlive the browser tab.
const GOOGLE_REGISTRATION_KEY = 'google_registration';

function readGoogleRegistration(): GoogleRegistrationContext | null {
  try {
    const raw = sessionStorage.getItem(GOOGLE_REGISTRATION_KEY);
    return raw ? (JSON.parse(raw) as GoogleRegistrationContext) : null;
  } catch {
    return null;
  }
}

function writeGoogleRegistration(context: GoogleRegistrationContext | null): void {
  try {
    if (context) {
      sessionStorage.setItem(GOOGLE_REGISTRATION_KEY, JSON.stringify(context));
    } else {
      sessionStorage.removeItem(GOOGLE_REGISTRATION_KEY);
    }
  } catch {
    // Storage blocked (private mode): the flow still works until a refresh.
  }
}

@State<RegistrationStateModel>({
  name: 'registration',
  defaults: initialRegistrationState
})
@Injectable()
export class RegistrationState implements NgxsOnInit {

  ngxsOnInit(ctx: StateContext<RegistrationStateModel>) {
    const googleRegistration = readGoogleRegistration();
    if (googleRegistration) {
      ctx.patchState({ googleRegistration });
    }
  }

  @Action(RegistrationActions.SetStep)
  setStep(ctx: StateContext<RegistrationStateModel>, action: RegistrationActions.SetStep) {
    ctx.patchState({
      currentStep: action.step
    });
  }

  @Action(RegistrationActions.RoleSelected)
  roleSelected(ctx: StateContext<RegistrationStateModel>, action: RegistrationActions.RoleSelected) {
    ctx.patchState({
      currentStep: action.role
    });
  }

  @Action(RegistrationActions.BackToRoleSelection)
  backToRoleSelection(ctx: StateContext<RegistrationStateModel>) {
    ctx.patchState({
      currentStep: 'choose-role'
    });
  }

  @Action(RegistrationActions.InitializeFromQueryParams)
  initializeFromQueryParams(ctx: StateContext<RegistrationStateModel>, action: RegistrationActions.InitializeFromQueryParams) {
    const step = action.step;
    if (step === 'mentee' || step === 'mentor') {
      ctx.patchState({
        currentStep: step
      });
    } else {
      ctx.patchState({
        currentStep: 'choose-role'
      });
    }
  }

  @Action(RegistrationActions.StartGoogleRegistration)
  startGoogleRegistration(
    ctx: StateContext<RegistrationStateModel>,
    action: RegistrationActions.StartGoogleRegistration
  ) {
    writeGoogleRegistration(action.context);
    ctx.patchState({ googleRegistration: action.context });
  }

  @Action(RegistrationActions.ClearGoogleRegistration)
  clearGoogleRegistration(ctx: StateContext<RegistrationStateModel>) {
    writeGoogleRegistration(null);
    ctx.patchState({ googleRegistration: null });
  }

  @Action(RegistrationActions.Reset)
  reset(ctx: StateContext<RegistrationStateModel>) {
    writeGoogleRegistration(null);
    ctx.setState(initialRegistrationState);
  }
}
