import { GoogleRegistrationContext, RegistrationStep } from '../models/registration.state.model';

export class SetStep {
  static readonly type = '[Registration] Set Step';
  constructor(public step: RegistrationStep) {}
}

export class RoleSelected {
  static readonly type = '[Registration] Role Selected';
  constructor(public role: 'mentee' | 'mentor') {}
}

export class BackToRoleSelection {
  static readonly type = '[Registration] Back To Role Selection';
}

export class InitializeFromQueryParams {
  static readonly type = '[Registration] Initialize From Query Params';
  constructor(public step?: string) {}
}

export class Reset {
  static readonly type = '[Registration] Reset';
}

/** Google sign-in found no GuroKonekt account: continue in Google registration mode. */
export class StartGoogleRegistration {
  static readonly type = '[Registration] Start Google Registration';
  constructor(public context: GoogleRegistrationContext) {}
}

export class ClearGoogleRegistration {
  static readonly type = '[Registration] Clear Google Registration';
}
