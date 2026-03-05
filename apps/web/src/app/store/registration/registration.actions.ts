import { RegistrationStep } from './registration.state.model';

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
