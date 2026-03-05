import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { RegistrationStateModel, initialRegistrationState, RegistrationStep } from './registration.state.model';
import * as RegistrationActions from './registration.actions';

@State<RegistrationStateModel>({
  name: 'registration',
  defaults: initialRegistrationState
})
@Injectable()
export class RegistrationState {

  @Selector()
  static currentStep(state: RegistrationStateModel): RegistrationStep {
    return state.currentStep;
  }

  @Selector()
  static isChooseRole(state: RegistrationStateModel): boolean {
    return state.currentStep === 'choose-role';
  }

  @Selector()
  static isMenteeStep(state: RegistrationStateModel): boolean {
    return state.currentStep === 'mentee';
  }

  @Selector()
  static isMentorStep(state: RegistrationStateModel): boolean {
    return state.currentStep === 'mentor';
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

  @Action(RegistrationActions.Reset)
  reset(ctx: StateContext<RegistrationStateModel>) {
    ctx.setState(initialRegistrationState);
  }
}
