import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { UserAuthenticationStatusInterface } from '@gurokonekt/models/interfaces/auth-requirements/auth-requirements.model';

import { buildApiUrl } from '../../shared/utils/api.util';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { AuthStorageService } from '../storage/auth-storage.service';

export type SetPasswordResult =
  | { status: 'done'; message: string }
  | { status: 'reauth-required'; message: string }
  | { status: 'failed'; message: string };

/**
 * The sign-in methods the platform requires (#463) and how far this account
 * is. The API refuses other requests until setup is complete, so this only
 * steers the screens. The answer is kept per access token, so signing in as
 * someone else, or getting new tokens after linking Google, reads it again.
 */
@Injectable({ providedIn: 'root' })
export class SecuritySetupService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorageService);
  private statusToken: string | null = null;

  readonly status = signal<UserAuthenticationStatusInterface | null>(null);

  /** The last answer, if it still belongs to the current session. */
  current(): UserAuthenticationStatusInterface | null {
    return this.statusToken && this.statusToken === this.storage.getToken() ? this.status() : null;
  }

  async refresh(): Promise<UserAuthenticationStatusInterface> {
    const result = await firstValueFrom(
      this.http.get<ApiResponse<UserAuthenticationStatusInterface>>(buildApiUrl(API_CONFIG.endpoints.auth.securitySetup))
    );
    const status = result.data as UserAuthenticationStatusInterface;
    this.statusToken = this.storage.getToken();
    this.status.set(status);
    return status;
  }

  /** For accounts created with Google, which have no password yet. */
  async setPassword(newPassword: string, confirmPassword: string): Promise<SetPasswordResult> {
    try {
      const result = await firstValueFrom(
        this.http.post<ApiResponse<UserAuthenticationStatusInterface>>(
          buildApiUrl(API_CONFIG.endpoints.auth.securitySetupPassword),
          { newPassword, confirmPassword }
        )
      );
      this.statusToken = this.storage.getToken();
      this.status.set(result.data as UserAuthenticationStatusInterface);
      return { status: 'done', message: result.message };
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 403 && error.error?.data?.reauthRequired) {
        return { status: 'reauth-required', message: error.error.message };
      }
      const message = (error as HttpErrorResponse)?.error?.message;
      return {
        status: 'failed',
        message: Array.isArray(message) ? message[0] : message || "We couldn't set your password. Please try again.",
      };
    }
  }
}
