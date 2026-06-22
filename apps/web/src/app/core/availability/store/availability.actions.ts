import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

export class FetchAvailability {
  static readonly type = '[Availability] Fetch';
  constructor(public userId: string) {}
}

export class FetchAvailabilitySuccess {
  static readonly type = '[Availability] Fetch Success';
  constructor(
    public payload: {
      availabilities: UserAvailabilityInterface[];
      sessionDurationMinutes: number;
    }
  ) {}
}

export class FetchAvailabilityFailure {
  static readonly type = '[Availability] Fetch Failure';
  constructor(public error: string) {}
}
