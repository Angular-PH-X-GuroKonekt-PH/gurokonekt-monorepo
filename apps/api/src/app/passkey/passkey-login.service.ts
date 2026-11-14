import { Injectable, Logger } from '@nestjs/common';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import {
  LogsActionType,
  ResponseDto,
  SelectFields,
  UserRole,
  UserStatus,
  VerifyPasskeyAuthenticationDto,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthResponseFactory } from '../auth/helpers/auth-response.factory';
import { readPasskeyConfig } from './passkey.service';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// Same as the JWT guard. Inactive users may still sign in so they can reactivate.
const BLOCKED_STATUSES: string[] = [UserStatus.Banned, UserStatus.Suspended, UserStatus.Deleted];

type SignInBlock =
  | 'PASSKEY_SIGNIN_FAILED'
  | 'SIGNIN_ACCOUNT_BLOCKED'
  | 'SIGNIN_MENTOR_PENDING_REVIEW'
  | 'SIGNIN_MENTOR_REJECTED';

/**
 * Sign in with a passkey. The browser proves possession of a saved passkey by
 * signing a one-time challenge; the API checks that signature with the stored
 * public key and then starts an ordinary Supabase session, so the rest of the
 * app treats it like any other login.
 */
@Injectable()
export class PasskeyLoginService {
  private readonly logger = new Logger(PasskeyLoginService.name);
  private readonly config = readPasskeyConfig();

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService
  ) {}

  /**
   * Options for the browser's passkey prompt. No email is asked for: the
   * passkeys are discoverable, so the browser offers the ones it has for this
   * site and the response says which account it belongs to.
   */
  async getAuthenticationOptions(): Promise<ResponseDto> {
    try {
      const options = await generateAuthenticationOptions({
        rpID: this.config.rpID,
        userVerification: 'required',
        timeout: CHALLENGE_TTL_MS,
      });

      const now = new Date();
      // Unused challenges are cleared as new ones are issued, keeping the table small.
      await this.prisma.db.passkeyChallenge.deleteMany({ where: { expiresAt: { lt: now } } });
      await this.prisma.db.passkeyChallenge.create({
        data: {
          challenge: options.challenge,
          type: 'authentication',
          expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
        },
      });

      return AuthResponseFactory.successByKey('PASSKEY_AUTHENTICATION_OPTIONS', options);
    } catch (error) {
      this.logger.error(`Passkey sign-in options failed: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Checks the browser's response and signs the person in. Every way this can
   * fail without a valid passkey (unknown passkey, bad signature, expired or
   * reused challenge) gets the same answer, so nothing is revealed about which
   * passkeys or accounts exist.
   */
  async verifyAuthentication(
    dto: VerifyPasskeyAuthenticationDto,
    ipAddress: string,
    userAgent: string
  ): Promise<ResponseDto> {
    try {
      const response = dto.response as unknown as AuthenticationResponseJSON;

      const challenge = await this.consumeChallenge(response);
      if (!challenge) {
        return this.fail('expired_or_unknown_challenge', ipAddress, userAgent);
      }

      const passkey = response.id
        ? await this.prisma.db.passkey.findUnique({
            where: { credentialId: response.id },
            select: { id: true, userId: true, credentialId: true, publicKey: true, counter: true, transports: true },
          })
        : null;
      if (!passkey) {
        return this.fail('unknown_passkey', ipAddress, userAgent);
      }

      // The passkey must also claim the account it was created for.
      const userHandle = response.response?.userHandle;
      if (userHandle && Buffer.from(userHandle, 'base64url').toString('utf8') !== passkey.userId) {
        return this.fail('user_handle_mismatch', ipAddress, userAgent, passkey.userId);
      }

      let verification: VerifiedAuthenticationResponse;
      try {
        verification = await verifyAuthenticationResponse({
          response,
          expectedChallenge: challenge,
          expectedOrigin: this.config.origins,
          expectedRPID: this.config.rpID,
          requireUserVerification: true,
          credential: {
            id: passkey.credentialId,
            publicKey: new Uint8Array(passkey.publicKey),
            counter: Number(passkey.counter),
            transports: passkey.transports,
          },
        });
      } catch (error) {
        // Includes a signature counter that went backwards, a sign of a cloned authenticator.
        this.logger.warn(`Passkey sign-in rejected: ${(error as Error).message}`);
        return this.fail('verification_failed', ipAddress, userAgent, passkey.userId);
      }
      if (!verification.verified) {
        return this.fail('verification_failed', ipAddress, userAgent, passkey.userId);
      }

      const user = await this.prisma.db.user.findUnique({
        where: { id: passkey.userId },
        select: SelectFields.getUserCredentialsSelect(),
      });
      const block = user ? signInBlockFor(user) : 'PASSKEY_SIGNIN_FAILED';
      if (!user || block) {
        await this.log(passkey.userId, 'failed', ipAddress, userAgent, { reason: block ?? 'unknown_user' });
        return AuthResponseFactory.errorByKey(block ?? 'PASSKEY_SIGNIN_FAILED');
      }

      await this.prisma.db.passkey.update({
        where: { id: passkey.id },
        data: {
          counter: BigInt(verification.authenticationInfo.newCounter),
          backedUp: verification.authenticationInfo.credentialBackedUp,
          lastUsedAt: new Date(),
        },
      });

      const session = await this.supabase.createSessionForVerifiedUser(user.email);
      if (!session) {
        return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
      }

      await this.log(user.id, 'success', ipAddress, userAgent, { passkeyId: passkey.id });
      return AuthResponseFactory.successByKey('SIGN_WITH_PASSKEY', { user, session, redirectUrl: null });
    } catch (error) {
      this.logger.error(`Passkey sign-in failed: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Finds and deletes the challenge the browser signed. Read from the
   * response's client data, then matched against the challenges this API
   * issued; each works once and only while unexpired.
   */
  private async consumeChallenge(response: AuthenticationResponseJSON): Promise<string | null> {
    let challenge: unknown;
    try {
      const clientData = JSON.parse(Buffer.from(response.response?.clientDataJSON ?? '', 'base64url').toString('utf8'));
      challenge = clientData?.challenge;
    } catch {
      return null;
    }
    if (typeof challenge !== 'string' || !challenge) {
      return null;
    }

    const { count } = await this.prisma.db.passkeyChallenge.deleteMany({
      where: { challenge, type: 'authentication', expiresAt: { gt: new Date() } },
    });
    return count === 1 ? challenge : null;
  }

  private async fail(reason: string, ipAddress: string, userAgent: string, userId?: string): Promise<ResponseDto> {
    await this.log(userId ?? '', 'failed', ipAddress, userAgent, { reason });
    return AuthResponseFactory.errorByKey('PASSKEY_SIGNIN_FAILED');
  }

  /** Logged without any credential material; the passkey's own ID at most. */
  private async log(
    userId: string,
    outcome: 'success' | 'failed',
    ipAddress: string,
    userAgent: string,
    metadata: Record<string, string>
  ): Promise<void> {
    await this.prisma.db.logs.create({
      data: {
        actionType: LogsActionType.SignInPasskey,
        targetId: userId,
        details: outcome === 'success' ? 'Signed in with passkey' : 'Passkey sign-in failed',
        metadata: { outcome, ...metadata },
        ipAddress: ipAddress ?? '',
        userAgent: userAgent ?? '',
        ...(userId ? { createdById: userId } : {}),
      },
    });
  }
}

/**
 * The same account rules as password login: pending or rejected mentors and
 * blocked accounts can't sign in, and admins never have passkeys.
 */
export function signInBlockFor(user: { role: string; status: string }): SignInBlock | null {
  if (user.role === UserRole.Admin) return 'PASSKEY_SIGNIN_FAILED';
  if (BLOCKED_STATUSES.includes(user.status)) return 'SIGNIN_ACCOUNT_BLOCKED';
  if (user.role === UserRole.Mentor) {
    if (user.status === UserStatus.PendingApproval || user.status === UserStatus.PendingReview) {
      return 'SIGNIN_MENTOR_PENDING_REVIEW';
    }
    if (user.status === UserStatus.Rejected) return 'SIGNIN_MENTOR_REJECTED';
  }
  return null;
}
