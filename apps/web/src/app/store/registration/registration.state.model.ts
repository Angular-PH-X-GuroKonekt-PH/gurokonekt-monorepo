export type RegistrationStep = 'choose-role' | 'mentee' | 'mentor';

export interface RegistrationStateModel {
  currentStep: RegistrationStep;
}

export const initialRegistrationState: RegistrationStateModel = {
  currentStep: 'choose-role'
};
