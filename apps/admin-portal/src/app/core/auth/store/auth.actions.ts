import { AdminUser } from '../../storage/auth-storage.service';

export class Login {
  static readonly type = '[Auth] Login';
  constructor(public payload: { email: string; password: string }) {}
}

export class LoginSuccess {
  static readonly type = '[Auth] Login Success';
  constructor(public payload: { user: AdminUser; token: string; message?: string }) {}
}

export class LoginFailure {
  static readonly type = '[Auth] Login Failure';
  constructor(public error: string) {}
}

export class RestoreSession {
  static readonly type = '[Auth] Restore Session';
}

export class Logout {
  static readonly type = '[Auth] Logout';
}

export class ClearAuthMessages {
  static readonly type = '[Auth] Clear Messages';
}
