import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  browserSupportsWebAuthn,
  startRegistration,
  WebAuthnError,
  type PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/browser';
import type { UserAuthenticationStatusInterface } from '@gurokonekt/models/interfaces/auth-requirements/auth-requirements.model';
import type { SignInMethodsChangeInterface } from '@gurokonekt/models/interfaces/sign-in-methods/sign-in-methods.model';

import { buildApiUrl } from '../../shared/utils/api.util';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '../../shared/interfaces/api-response.interface';
import { AuthStorageService } from '../storage/auth-storage.service';
import type { GoogleCredential } from '../../shared/components/google-sign-in-button/google-sign-in-button.component';

export type SetupStepResult =
  | { status: 'done' }
  /** The person closed the passkey prompt: not an error. */
  | { status: 'cancelled' }
  /** The sign-in is more than 10 minutes old; sign in again first. */
  | { status: 'reauth-required'; message: string }
  | { status: 'failed'; message: string };

/**
 * The sign-in methods the platform requires (#463) and how far this admin is.
 * The API blocks every other admin endpoint until setup is complete, so this
 * only steers the screens; it is not the check that matters.
 */
@Injectable({ providedIn: 'root' })
export class SecuritySetupService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorageService);

  readonly status = signal<UserAuthenticationStatusInterface | null>(null);

  async refresh(): Promise<UserAuthenticationStatusInterface> {
    const result = await firstValueFrom(
      this.http.get<ApiResponse<UserAuthenticationStatusInterface>>(buildApiUrl(API_CONFIG.endpoints.auth.securitySetup))
    );
    const status = result.data as UserAuthenticationStatusInterface;
    this.status.set(status);
    return status;
  }

  clear(): void {
    this.status.set(null);
  }

  passkeysSupported(): boolean {
    return browserSupportsWebAuthn();
  }

  async addPasskey(): Promise<SetupStepResult> {
    try {
      const options = await firstValueFrom(
        this.http.post<ApiResponse<PublicKeyCredentialCreationOptionsJSON>>(
          buildApiUrl(API_CONFIG.endpoints.auth.passkeyRegistrationOptions),
          {}
        )
      );

      let response;
      try {
        response = await startRegistration({ optionsJSON: options.data as PublicKeyCredentialCreationOptionsJSON });
      } catch (error) {
        const name = (error as { name?: string })?.name;
        if (name === 'NotAllowedError' || name === 'AbortError' || (error as WebAuthnError)?.code === 'ERROR_CEREMONY_ABORTED') {
          return { status: 'cancelled' };
        }
        if (name === 'InvalidStateError') {
          return { status: 'failed', message: 'This device already has a passkey for your account.' };
        }
        return { status: 'failed', message: "Your device couldn't create a passkey. Please try again." };
      }

      await firstValueFrom(
        this.http.post(buildApiUrl(API_CONFIG.endpoints.auth.passkeyRegistrationVerify), { response, name: 'Admin passkey' })
      );
      return { status: 'done' };
    } catch (error) {
      return failure(error);
    }
  }

  async connectGoogle(credential: GoogleCredential): Promise<SetupStepResult> {
    try {
      const result = await firstValueFrom(
        this.http.post<ApiResponse<SignInMethodsChangeInterface>>(buildApiUrl(API_CONFIG.endpoints.auth.googleConnect), {
          idToken: credential.idToken,
          nonce: credential.nonce,
          refreshToken: this.storage.getRefreshToken() ?? '',
        })
      );
      // Linking issues new tokens; the old ones no longer describe the account.
      const session = result.data?.session;
      if (session) {
        this.storage.setToken(session.accessToken);
        this.storage.setRefreshToken(session.refreshToken);
      }
      return { status: 'done' };
    } catch (error) {
      return failure(error);
    }
  }
}

function failure(error: unknown): SetupStepResult {
  if (error instanceof HttpErrorResponse && error.status === 403 && error.error?.data?.reauthRequired) {
    return { status: 'reauth-required', message: error.error.message };
  }
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return { status: 'failed', message: 'Unable to reach the server. Please check your connection and try again.' };
  }
  return {
    status: 'failed',
    message: (error as HttpErrorResponse)?.error?.message || 'Something went wrong. Please try again.',
  };
}
