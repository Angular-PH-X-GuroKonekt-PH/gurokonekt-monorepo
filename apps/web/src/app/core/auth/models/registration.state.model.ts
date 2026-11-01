import type {
  GoogleRegistrationPrefillInterface,
  GoogleRegistrationTokensInterface,
} from '@gurokonekt/models/interfaces/auth/signin.model';

export type RegistrationStep = 'choose-role' | 'mentee' | 'mentor';

/**
 * A Google account with no GuroKonekt account yet. The tokens prove the Google
 * identity to the API until the registration form is submitted; the prefill
 * comes from the Google profile.
 */
export interface GoogleRegistrationContext extends GoogleRegistrationTokensInterface {
  prefill: GoogleRegistrationPrefillInterface;
}

export interface RegistrationStateModel {
  currentStep: RegistrationStep;
  googleRegistration: GoogleRegistrationContext | null;
}

export const initialRegistrationState: RegistrationStateModel = {
  currentStep: 'choose-role',
  googleRegistration: null,
};
