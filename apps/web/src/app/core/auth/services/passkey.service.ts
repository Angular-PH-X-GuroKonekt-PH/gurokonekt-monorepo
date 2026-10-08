import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  browserSupportsWebAuthn,
  startRegistration,
  WebAuthnError,
  type PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/browser';
import type { PasskeySummaryInterface } from '@gurokonekt/models/interfaces/passkey/passkey.model';

import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';

export type PasskeyRegistrationResult =
  | { status: 'added'; passkey: PasskeySummaryInterface; message: string }
  /** The person closed the device prompt or it timed out: not an error. */
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

const GENERIC_FAILURE = "We couldn't add your passkey. Please try again.";

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
}

function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    return error.error?.message || GENERIC_FAILURE;
  }
  return GENERIC_FAILURE;
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
