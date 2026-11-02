import { Injectable, Logger } from '@nestjs/common';
import type { Session, User } from '@supabase/supabase-js';
import {
  ConnectGoogleDto,
  DisconnectGoogleDto,
  LogsActionType,
  ResponseDto,
  SignInMethodsChangeInterface,
  SignInMethodsInterface,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthResponseFactory } from '../auth/helpers/auth-response.factory';

/** Changing how an account signs in needs a sign-in this recent. */
export const SIGN_IN_METHOD_REAUTH_WINDOW_MS = 10 * 60 * 1000;

/** Who is asking, as set by the JWT guard, plus their bearer token. */
export interface SignInMethodsRequester {
  id: string;
  authenticatedAt?: Date | null;
  accessToken: string;
}

/**
 * Account linking: which sign-in methods an account has, and connecting or
 * disconnecting Google. Every provider attaches to the same Supabase user, so
 * linking never creates a second GuroKonekt account and the mentor/mentee
 * data stays where it is. Linking happens only here, while signed in and
 * after a recent sign-in, never because two email addresses match.
 */
@Injectable()
export class SignInMethodsService {
  private readonly logger = new Logger(SignInMethodsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService
  ) {}

  async listMethods(userId: string): Promise<ResponseDto> {
    try {
      const methods = await this.readMethods(userId);
      return methods
        ? AuthResponseFactory.successByKey('SIGN_IN_METHODS_LISTED', methods)
        : AuthResponseFactory.errorByKey('USER_NOT_FOUND');
    } catch (error) {
      this.logger.error(`Listing sign-in methods failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  async connectGoogle(
    requester: SignInMethodsRequester,
    dto: ConnectGoogleDto,
    ipAddress: string,
    userAgent: string,
    now: Date = new Date()
  ): Promise<ResponseDto> {
    const userId = requester.id;
    try {
      if (!isRecentSignIn(requester.authenticatedAt, now)) {
        return AuthResponseFactory.errorByKey('SIGN_IN_METHOD_REAUTH_REQUIRED', { reauthRequired: true });
      }

      const { session, error } = await this.supabase.linkGoogleWithSession(
        { access_token: requester.accessToken, refresh_token: dto.refreshToken },
        dto.idToken,
        dto.nonce
      );
      if (error) {
        this.logger.warn(`Connecting Google failed for ${userId}: ${error.code ?? ''} ${error.message}`);
        if (error.code === 'identity_already_exists') {
          return AuthResponseFactory.errorByKey('GOOGLE_ALREADY_LINKED');
        }
        if (error.code === 'manual_linking_disabled') {
          return AuthResponseFactory.errorByKey('GOOGLE_LINKING_UNAVAILABLE');
        }
        return AuthResponseFactory.errorByKey('GOOGLE_LINK_FAILED');
      }
      // Supabase acts on the session's own user, so a mismatch would mean tampering.
      if (session && session.user.id !== userId) {
        this.logger.error(`Google link session belonged to ${session.user.id}, not ${userId}`);
        return AuthResponseFactory.errorByKey('GOOGLE_LINK_FAILED');
      }

      // Remember which Google account was approved here, so signing in with it
      // isn't mistaken for Supabase's automatic email-match linking.
      const authUser = await this.getAuthUser(userId);
      const google = authUser?.identities?.find((identity) => identity.provider === 'google');
      await this.prisma.db.user.update({
        where: { id: userId },
        data: { googleIdentityId: google?.identity_id ?? null },
      });

      const methods = await this.readMethods(userId);
      await this.log(LogsActionType.GoogleConnect, userId, 'Google connected', ipAddress, userAgent, {
        googleEmail: methods?.google.email ?? '',
      });
      return AuthResponseFactory.successByKey('GOOGLE_CONNECTED', this.change(methods, session));
    } catch (error) {
      this.logger.error(`Connecting Google failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  async disconnectGoogle(
    requester: SignInMethodsRequester,
    dto: DisconnectGoogleDto,
    ipAddress: string,
    userAgent: string,
    now: Date = new Date()
  ): Promise<ResponseDto> {
    const userId = requester.id;
    try {
      if (!isRecentSignIn(requester.authenticatedAt, now)) {
        return AuthResponseFactory.errorByKey('SIGN_IN_METHOD_REAUTH_REQUIRED', { reauthRequired: true });
      }

      const authUser = await this.getAuthUser(userId);
      const google = authUser?.identities?.find((identity) => identity.provider === 'google');
      if (!authUser || !google) {
        return AuthResponseFactory.errorByKey('GOOGLE_NOT_LINKED');
      }
      // Keep a way back in: a Google-created account has no password to fall back on.
      if (!hasPassword(authUser)) {
        return AuthResponseFactory.errorByKey('GOOGLE_DISCONNECT_NOT_ALLOWED');
      }

      const session = await this.supabase.unlinkIdentityWithSession(
        { access_token: requester.accessToken, refresh_token: dto.refreshToken },
        google
      );
      if (!session) {
        return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
      }
      await this.prisma.db.user.update({ where: { id: userId }, data: { googleIdentityId: null } });

      await this.log(LogsActionType.GoogleDisconnect, userId, 'Google disconnected', ipAddress, userAgent, {
        googleEmail: String(google.identity_data?.['email'] ?? ''),
      });
      const methods = await this.readMethods(userId);
      return AuthResponseFactory.successByKey('GOOGLE_DISCONNECTED', this.change(methods, session));
    } catch (error) {
      this.logger.error(`Disconnecting Google failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  private async readMethods(userId: string): Promise<SignInMethodsInterface | null> {
    const authUser = await this.getAuthUser(userId);
    if (!authUser) return null;

    const google = authUser.identities?.find((identity) => identity.provider === 'google');
    const passkeys = await this.prisma.db.passkey.count({ where: { userId } });
    return {
      password: hasPassword(authUser),
      google: { connected: !!google, email: (google?.identity_data?.['email'] as string | undefined) ?? null },
      passkeys,
    };
  }

  /** The admin API returns identities in full; the list endpoint does not. */
  private async getAuthUser(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase.clientAdmin.auth.admin.getUserById(userId);
    if (error) {
      this.logger.warn(`Could not read auth user ${userId}: ${error.message}`);
      return null;
    }
    return data.user;
  }

  private change(methods: SignInMethodsInterface | null, session: Session | null): SignInMethodsChangeInterface {
    return {
      methods: methods ?? { password: false, google: { connected: false, email: null }, passkeys: 0 },
      session:
        session?.access_token && session.refresh_token
          ? { accessToken: session.access_token, refreshToken: session.refresh_token }
          : null,
    };
  }

  private async log(
    actionType: LogsActionType,
    userId: string,
    details: string,
    ipAddress: string,
    userAgent: string,
    metadata: Record<string, string>
  ): Promise<void> {
    await this.prisma.db.logs.create({
      data: {
        actionType,
        targetId: userId,
        details,
        metadata,
        ipAddress: ipAddress ?? '',
        userAgent: userAgent ?? '',
        createdById: userId,
      },
    });
  }
}

export function isRecentSignIn(authenticatedAt: Date | null | undefined, now: Date): boolean {
  return !!authenticatedAt && now.getTime() - authenticatedAt.getTime() <= SIGN_IN_METHOD_REAUTH_WINDOW_MS;
}

/** Email/password accounts have an "email" identity. */
function hasPassword(user: User): boolean {
  return (user.identities ?? []).some((identity) => identity.provider === 'email');
}
