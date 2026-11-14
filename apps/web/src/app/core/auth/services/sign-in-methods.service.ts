import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  SignInMethodsChangeInterface,
  SignInMethodsInterface,
} from '@gurokonekt/models/interfaces/sign-in-methods/sign-in-methods.model';

import { buildApiUrl } from '../../../shared/utils/api.util';
import { API_CONFIG } from '../../config/api.config';
import { ApiResponse } from '../../../shared/interfaces/api-response.interface';
import { AuthStorageService } from '../../storage/auth-storage.service';
import type { GoogleCredential } from '../components/google-sign-in-button/google-sign-in-button.component';

export type SignInMethodChangeResult =
  | { status: 'done'; methods: SignInMethodsInterface; message: string }
  /** The sign-in is too old for this change; sign in again first. */
  | { status: 'reauth-required'; message: string }
  | { status: 'failed'; message: string };

/**
 * Account linking from Settings: which sign-in methods the account has, and
 * connecting or disconnecting Google. Supabase only lets users change their own
 * identities, so the stored refresh token goes along, and the tokens that come
 * back replace the stored ones.
 */
@Injectable({ providedIn: 'root' })
export class SignInMethodsService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorageService);

  async list(): Promise<SignInMethodsInterface> {
    const result = await firstValueFrom(
      this.http.get<ApiResponse<SignInMethodsInterface>>(buildApiUrl(API_CONFIG.endpoints.signInMethods.list))
    );
    return result.data as SignInMethodsInterface;
  }

  connectGoogle(credential: GoogleCredential): Promise<SignInMethodChangeResult> {
    return this.change(
      this.http.post<ApiResponse<SignInMethodsChangeInterface>>(buildApiUrl(API_CONFIG.endpoints.signInMethods.google), {
        idToken: credential.idToken,
        nonce: credential.nonce,
        refreshToken: this.storage.getRefreshToken() ?? '',
      }),
      'Google is now connected.'
    );
  }

  disconnectGoogle(): Promise<SignInMethodChangeResult> {
    return this.change(
      this.http.delete<ApiResponse<SignInMethodsChangeInterface>>(buildApiUrl(API_CONFIG.endpoints.signInMethods.google), {
        body: { refreshToken: this.storage.getRefreshToken() ?? '' },
      }),
      'Google has been disconnected.'
    );
  }

  private async change(
    request: ReturnType<HttpClient['post']>,
    fallbackMessage: string
  ): Promise<SignInMethodChangeResult> {
    try {
      const result = (await firstValueFrom(request)) as ApiResponse<SignInMethodsChangeInterface>;
      const data = result.data as SignInMethodsChangeInterface;
      if (data.session) {
        this.storage.setToken(data.session.accessToken);
        this.storage.setRefreshToken(data.session.refreshToken);
      }
      return { status: 'done', methods: data.methods, message: result.message || fallbackMessage };
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 403 && error.error?.data?.reauthRequired) {
        return { status: 'reauth-required', message: error.error.message };
      }
      const message =
        error instanceof HttpErrorResponse && error.status === 0
          ? 'Unable to reach the server. Please check your connection and try again.'
          : (error as HttpErrorResponse)?.error?.message || 'Something went wrong. Please try again.';
      return { status: 'failed', message };
    }
  }
}
