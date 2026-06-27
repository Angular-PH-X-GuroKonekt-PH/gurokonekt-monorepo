import { Injectable } from '@angular/core';
import { AuthUser } from '@gurokonekt/models/interfaces/auth/auth-user.interface';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const LAST_REGISTERED_EMAIL_KEY = 'last_registered_email';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  clearRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getLastRegisteredEmail(): string | null {
    return localStorage.getItem(LAST_REGISTERED_EMAIL_KEY);
  }

  setLastRegisteredEmail(email: string): void {
    localStorage.setItem(LAST_REGISTERED_EMAIL_KEY, email);
  }

  clearLastRegisteredEmail(): void {
    localStorage.removeItem(LAST_REGISTERED_EMAIL_KEY);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
