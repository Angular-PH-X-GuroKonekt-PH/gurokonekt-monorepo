import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  WebAuthnError,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import type { AuthUser } from '@gurokonekt/models/interfaces/auth/auth-user.interface';
import type { PasskeySummaryInterface } from '@gurokonekt/models/interfaces/passkey/passkey.model';

import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';
import type { LoginApiResponse } from '../../../shared/interfaces/auth-api.interface';

export type PasskeyRegistrationResult =
  | { status: 'added'; passkey: PasskeySummaryInterface; message: string }
  /** The person closed the device prompt or it timed out: not an error. */
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

const GENERIC_FAILURE = "We couldn't add your passkey. Please try again.";
const SIGN_IN_FAILURE = "We couldn't sign you in with a passkey. Please try again or use another sign-in method.";

export type PasskeySignInResult =
  | { status: 'signed-in'; user: AuthUser; token: string; refreshToken?: string; message: string }
  /** The person closed the passkey prompt or it timed out: not an error. */
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

/**
 * Adds a passkey to the signed-in account: the API issues a one-time
 * challenge, the browser's passkey prompt (biometrics, PIN, password manager)
 * creates the key pair on the device, and the API verifies the result and
 * keeps only the public key.
 */
@Injectable({ providedIn: 'root' })
export class PasskeyService {
  private readonly http = inject(HttpClient);

  /** False on browsers or devices with no WebAuthn support at all. */
  isSupported(): boolean {
    return browserSupportsWebAuthn();
  }

  async register(name: string): Promise<PasskeyRegistrationResult> {
    let optionsJSON: PublicKeyCredentialCreationOptionsJSON;
    try {
      const options = await firstValueFrom(
        this.http.post<ApiResponse<PublicKeyCredentialCreationOptionsJSON>>(
          buildApiUrl(API_CONFIG.endpoints.passkeys.registrationOptions),
          {}
        )
      );
      optionsJSON = options.data as PublicKeyCredentialCreationOptionsJSON;
    } catch (error) {
      return { status: 'failed', message: apiErrorMessage(error) };
    }

    let response;
    try {
      response = await startRegistration({ optionsJSON });
    } catch (error) {
      return browserErrorResult(error);
    }

    try {
      const result = await firstValueFrom(
        this.http.post<ApiResponse<PasskeySummaryInterface>>(
          buildApiUrl(API_CONFIG.endpoints.passkeys.registrationVerify),
          { response, name }
        )
      );
      return {
        status: 'added',
        passkey: result.data as PasskeySummaryInterface,
        message: result.message || 'Your passkey has been added.',
      };
    } catch (error) {
      return { status: 'failed', message: apiErrorMessage(error) };
    }
  }

  /**
   * Sign in with a passkey: the API issues a one-time challenge, the browser
   * lets the person pick one of their passkeys for this site (no email
   * needed), and the API checks the signature and starts a session.
   */
  async signIn(): Promise<PasskeySignInResult> {
    let optionsJSON: PublicKeyCredentialRequestOptionsJSON;
    try {
      const options = await firstValueFrom(
        this.http.post<ApiResponse<PublicKeyCredentialRequestOptionsJSON>>(
          buildApiUrl(API_CONFIG.endpoints.passkeys.authenticationOptions),
          {}
        )
      );
      optionsJSON = options.data as PublicKeyCredentialRequestOptionsJSON;
    } catch (error) {
      return { status: 'failed', message: apiErrorMessage(error, SIGN_IN_FAILURE) };
    }

    let response;
    try {
      response = await startAuthentication({ optionsJSON });
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === 'NotAllowedError' || name === 'AbortError' || (error as WebAuthnError)?.code === 'ERROR_CEREMONY_ABORTED') {
        return { status: 'cancelled' };
      }
      return { status: 'failed', message: SIGN_IN_FAILURE };
    }

    try {
      const result = await firstValueFrom(
        this.http.post<LoginApiResponse>(buildApiUrl(API_CONFIG.endpoints.passkeys.authenticationVerify), { response })
      );
      const user = result.data?.user;
      const session = result.data?.session;
      if (!user || !session?.access_token) {
        return { status: 'failed', message: SIGN_IN_FAILURE };
      }
      return {
        status: 'signed-in',
        user: {
          id: user.id,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
          role: user.role as AuthUser['role'],
          status: user.status as AuthUser['status'],
          isProfileComplete: !!user.isProfileComplete,
          isMentorProfileComplete: !!user.isMentorProfileComplete,
        },
        token: session.access_token,
        refreshToken: session.refresh_token,
        message: result.message || 'Signed in with passkey successfully',
      };
    } catch (error) {
      return { status: 'failed', message: apiErrorMessage(error, SIGN_IN_FAILURE) };
    }
  }

  /** The signed-in user's passkeys, newest first. */
  async list(): Promise<PasskeySummaryInterface[]> {
    const result = await firstValueFrom(
      this.http.get<ApiResponse<PasskeySummaryInterface[]>>(buildApiUrl(API_CONFIG.endpoints.passkeys.list))
    );
    return result.data ?? [];
  }

  async rename(passkeyId: string, name: string): Promise<PasskeyChangeResult<PasskeySummaryInterface>> {
    try {
      const result = await firstValueFrom(
        this.http.patch<ApiResponse<PasskeySummaryInterface>>(
          buildApiUrl(API_CONFIG.endpoints.passkeys.byId(passkeyId)),
          { name }
        )
      );
      return { status: 'done', data: result.data as PasskeySummaryInterface, message: result.message || 'Passkey renamed.' };
    } catch (error) {
      return { status: 'failed', message: apiErrorMessage(error) };
    }
  }

  /**
   * Removes a passkey. The API only allows this shortly after a sign-in;
   * otherwise the result is `reauth-required` and the person signs in again.
   */
  async remove(passkeyId: string): Promise<PasskeyChangeResult<null>> {
    try {
      const result = await firstValueFrom(
        this.http.delete<ApiResponse<unknown>>(buildApiUrl(API_CONFIG.endpoints.passkeys.byId(passkeyId)))
      );
      return { status: 'done', data: null, message: result.message || 'Passkey removed.' };
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 403 && error.error?.data?.reauthRequired) {
        return { status: 'reauth-required', message: error.error.message };
      }
      return { status: 'failed', message: apiErrorMessage(error) };
    }
  }
}

export type PasskeyChangeResult<T> =
  | { status: 'done'; data: T; message: string }
  | { status: 'reauth-required'; message: string }
  | { status: 'failed'; message: string };

function apiErrorMessage(error: unknown, fallback = GENERIC_FAILURE): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    return error.error?.message || fallback;
  }
  return fallback;
}

/** Turns the browser's passkey errors into what the person should do next. */
function browserErrorResult(error: unknown): PasskeyRegistrationResult {
  const name = (error as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'AbortError') {
    return { status: 'cancelled' };
  }

  if (error instanceof WebAuthnError) {
    switch (error.code) {
      case 'ERROR_CEREMONY_ABORTED':
        return { status: 'cancelled' };
      case 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED':
        return { status: 'failed', message: 'This device already has a passkey for your account.' };
      case 'ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT':
      case 'ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT':
      case 'ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG':
        return {
          status: 'failed',
          message: "This device can't create a passkey for GuroKonekt. Try your phone or a password manager instead.",
        };
    }
  }

  return { status: 'failed', message: GENERIC_FAILURE };
}

/** A friendly default label such as "Chrome on Windows". */
export function describeThisDevice(userAgent: string = navigator.userAgent): string {
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Chrome\//.test(userAgent)
          ? 'Chrome'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : 'Browser';
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /iPhone|iPad|iPod/.test(userAgent)
      ? 'iOS'
      : /Mac OS X/.test(userAgent)
        ? 'macOS'
        : /Android/.test(userAgent)
          ? 'Android'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : null;
  return os ? `${browser} on ${os}` : browser;
}
