import { Selector } from "@ngxs/store";
import { RegistrationStateModel, RegistrationStep } from "../models/registration.state.model";
import { RegistrationState } from "./registration.state";

export class RegistrationSelectors {
  @Selector([RegistrationState])
  static currentStep(state: RegistrationStateModel): RegistrationStep {
    return state.currentStep;
  }

  @Selector([RegistrationState])
  static isChooseRole(state: RegistrationStateModel): boolean {
    return state.currentStep === 'choose-role';
  }

  @Selector([RegistrationState])
  static isMenteeStep(state: RegistrationStateModel): boolean {
    return state.currentStep === 'mentee';
  }

  @Selector([RegistrationState])
  static isMentorStep(state: RegistrationStateModel): boolean {
    return state.currentStep === 'mentor';
  }
}