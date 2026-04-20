import { RegisterMenteeRequest, RegisterMentorRequest } from '@gurokonekt/models';
import type { UpdateMenteeProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';

export class Login {
  static readonly type = '[Auth] Login';
  constructor(public payload: { email: string; password: string }) {}
}

export class LoginSuccess {
  static readonly type = '[Auth] Login Success';
  constructor(public payload: { user: { id: string; email: string; role: string; [key: string]: unknown }; token?: string; message?: string }) {}
}

export class LoginFailure {
  static readonly type = '[Auth] Login Failure';
  constructor(public error: string) {}
}

export class RestoreSession {
  static readonly type = '[Auth] Restore Session';
}

export class RegisterMentee {
  static readonly type = '[Auth] Register Mentee';
  constructor(public payload: RegisterMenteeRequest) {}
}

export class RegisterMenteeSuccess {
  static readonly type = '[Auth] Register Mentee Success';
  constructor(public payload: { message: string; email: string }) {}
}

export class RegisterMenteeFailure {
  static readonly type = '[Auth] Register Mentee Failure';
  constructor(public error: string) {}
}

export class RegisterMentor {
  static readonly type = '[Auth] Register Mentor';
  constructor(public payload: RegisterMentorRequest) {}
}

export class RegisterMentorSuccess {
  static readonly type = '[Auth] Register Mentor Success';
  constructor(public payload: { message: string; email: string }) {}
}

export class RegisterMentorFailure {
  static readonly type = '[Auth] Register Mentor Failure';
  constructor(public error: string) {}
}

export class UpdateMenteeProfile {
  static readonly type = '[Auth] Update Mentee Profile';
  constructor(public payload: { userId: string; profileData: Partial<UpdateMenteeProfileInterface>; avatarFile?: File }) {}
}

export class UpdateMenteeProfileSuccess {
  static readonly type = '[Auth] Update Mentee Profile Success';
  constructor(public message?: string) {}
}

export class UpdateMenteeProfileFailure {
  static readonly type = '[Auth] Update Mentee Profile Failure';
  constructor(public error: string) {}
}

export class Logout {
  static readonly type = '[Auth] Logout';
}

export class ClearAuthMessages {
  static readonly type = '[Auth] Clear Messages';
}

export class ResetAuthState {
  static readonly type = '[Auth] Reset State';
}
