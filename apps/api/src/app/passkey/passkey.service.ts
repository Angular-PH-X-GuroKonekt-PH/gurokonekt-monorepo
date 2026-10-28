import { Injectable, Logger } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
  type VerifiedRegistrationResponse,
} from '@simplewebauthn/server';
import {
  LogsActionType,
  PasskeySummaryInterface,
  RenamePasskeyDto,
  ResponseDto,
  UserRole,
  VerifyPasskeyRegistrationDto,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseFactory } from '../auth/helpers/auth-response.factory';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PASSKEY_NAME = 'Passkey';
/** How recent a sign-in must be to remove a passkey. */
export const PASSKEY_REMOVAL_REAUTH_WINDOW_MS = 10 * 60 * 1000;

const PASSKEY_SUMMARY_SELECT = {
  id: true,
  name: true,
  deviceType: true,
  backedUp: true,
  createdAt: true,
  lastUsedAt: true,
} as const;

/** Who is asking, as set by the JWT guard. */
export interface PasskeyRequester {
  id: string;
  authenticatedAt?: Date | null;
}

/**
 * WebAuthn relying party settings. The RP ID is the domain passkeys are bound
 * to; a parent domain (gurokonekt.com) covers every subdomain the web app runs
 * on. Origins are the exact web app URLs allowed to create passkeys.
 */
export function readPasskeyConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    rpName: env['WEBAUTHN_RP_NAME'] || 'GuroKonekt',
    rpID: env['WEBAUTHN_RP_ID'] || 'localhost',
    origins: (env['WEBAUTHN_ORIGINS'] || 'http://localhost:4200')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

@Injectable()
export class PasskeyService {
  private readonly logger = new Logger(PasskeyService.name);
  private readonly config = readPasskeyConfig();

  constructor(private readonly prisma: PrismaService) {
    if (!process.env['WEBAUTHN_RP_ID'] && process.env['NODE_ENV'] !== 'development') {
      // Fails closed: browsers on any real domain will be rejected until this is set.
      this.logger.warn('WEBAUTHN_RP_ID is not set; passkeys only work on http://localhost:4200');
    }
  }

  /**
   * Step 1 of adding a passkey: options for the browser's passkey prompt. The
   * passkey is discoverable and needs user verification (biometrics, PIN or
   * device lock) so it can later sign the user in without an email. The
   * user's existing passkeys are excluded so one authenticator can't be added
   * twice.
   */
  async getRegistrationOptions(userId: string): Promise<ResponseDto> {
    try {
      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });
      if (!user) {
        return AuthResponseFactory.errorByKey('USER_NOT_FOUND');
      }
      if (user.role === UserRole.Admin) {
        return AuthResponseFactory.errorByKey('PASSKEY_NOT_AVAILABLE');
      }

      const existing = await this.prisma.db.passkey.findMany({
        where: { userId },
        select: { credentialId: true, transports: true },
      });

      const options = await generateRegistrationOptions({
        rpName: this.config.rpName,
        rpID: this.config.rpID,
        userName: user.email,
        userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
        // The user ID becomes the passkey's user handle, which passkey login maps back to the account.
        userID: new TextEncoder().encode(user.id),
        attestationType: 'none',
        timeout: CHALLENGE_TTL_MS,
        excludeCredentials: existing.map((passkey) => ({
          id: passkey.credentialId,
          transports: passkey.transports,
        })),
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      });

      // One open registration per user: a new attempt replaces the previous one.
      const now = new Date();
      await this.prisma.db.passkeyChallenge.deleteMany({
        where: { OR: [{ userId, type: 'registration' }, { expiresAt: { lt: now } }] },
      });
      await this.prisma.db.passkeyChallenge.create({
        data: {
          userId,
          challenge: options.challenge,
          type: 'registration',
          expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
        },
      });

      return AuthResponseFactory.successByKey('PASSKEY_REGISTRATION_OPTIONS', options);
    } catch (error) {
      this.logger.error(`Passkey registration options failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Step 2: checks the browser's response against the challenge from step 1
   * and saves the passkey. Only the public key is kept; the private key never
   * leaves the user's device or password manager.
   */
  async verifyRegistration(
    userId: string,
    dto: VerifyPasskeyRegistrationDto,
    ipAddress: string,
    userAgent: string
  ): Promise<ResponseDto> {
    try {
      const challenge = await this.prisma.db.passkeyChallenge.findFirst({
        where: { userId, type: 'registration', expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!challenge) {
        return AuthResponseFactory.errorByKey('PASSKEY_CHALLENGE_EXPIRED');
      }
      // Single use, whether or not verification succeeds.
      await this.prisma.db.passkeyChallenge.delete({ where: { id: challenge.id } });

      let verification: VerifiedRegistrationResponse;
      try {
        verification = await verifyRegistrationResponse({
          response: dto.response as unknown as RegistrationResponseJSON,
          expectedChallenge: challenge.challenge,
          expectedOrigin: this.config.origins,
          expectedRPID: this.config.rpID,
          requireUserVerification: true,
        });
      } catch (error) {
        this.logger.warn(`Passkey registration rejected for ${userId}: ${(error as Error).message}`);
        return AuthResponseFactory.errorByKey('PASSKEY_VERIFICATION_FAILED');
      }

      if (!verification.verified) {
        return AuthResponseFactory.errorByKey('PASSKEY_VERIFICATION_FAILED');
      }

      const { credential, credentialDeviceType, credentialBackedUp, aaguid } = verification.registrationInfo;
      const duplicate = await this.prisma.db.passkey.findUnique({
        where: { credentialId: credential.id },
        select: { id: true },
      });
      if (duplicate) {
        return AuthResponseFactory.errorByKey('PASSKEY_ALREADY_REGISTERED');
      }

      const passkey = await this.prisma.db.passkey.create({
        data: {
          userId,
          credentialId: credential.id,
          publicKey: Buffer.from(credential.publicKey),
          counter: BigInt(credential.counter),
          transports: credential.transports ?? [],
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          // All zeros means the authenticator chose not to say what it is.
          aaguid: /^[0-]+$/.test(aaguid) ? null : aaguid,
          name: dto.name?.trim() || DEFAULT_PASSKEY_NAME,
        },
        select: { id: true, name: true, deviceType: true, backedUp: true, createdAt: true },
      });

      await this.prisma.db.logs.create({
        data: {
          actionType: LogsActionType.PasskeyRegister,
          targetId: userId,
          details: `Passkey added: ${passkey.name}`,
          metadata: { passkeyId: passkey.id, deviceType: passkey.deviceType, backedUp: passkey.backedUp },
          ipAddress: ipAddress ?? '',
          userAgent: userAgent ?? '',
          createdById: userId,
        },
      });

      const summary: PasskeySummaryInterface = passkey;
      return AuthResponseFactory.successByKey('PASSKEY_REGISTERED', summary);
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') {
        // Lost a race with an identical registration.
        return AuthResponseFactory.errorByKey('PASSKEY_ALREADY_REGISTERED');
      }
      this.logger.error(`Passkey registration failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  /** The caller's own passkeys, newest first. Never includes key material. */
  async listPasskeys(userId: string): Promise<ResponseDto> {
    try {
      const passkeys: PasskeySummaryInterface[] = await this.prisma.db.passkey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: PASSKEY_SUMMARY_SELECT,
      });
      return AuthResponseFactory.successByKey('PASSKEYS_LISTED', passkeys);
    } catch (error) {
      this.logger.error(`Listing passkeys failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Renames one of the caller's passkeys. The owner is part of the lookup, so
   * another user's passkey ID behaves exactly like a missing one.
   */
  async renamePasskey(
    userId: string,
    passkeyId: string,
    dto: RenamePasskeyDto,
    ipAddress: string,
    userAgent: string
  ): Promise<ResponseDto> {
    try {
      const { count } = await this.prisma.db.passkey.updateMany({
        where: { id: passkeyId, userId },
        data: { name: dto.name },
      });
      if (count === 0) {
        return AuthResponseFactory.errorByKey('PASSKEY_NOT_FOUND');
      }

      const passkey: PasskeySummaryInterface = await this.prisma.db.passkey.findUniqueOrThrow({
        where: { id: passkeyId },
        select: PASSKEY_SUMMARY_SELECT,
      });
      await this.logPasskeyAction(LogsActionType.PasskeyRename, userId, `Passkey renamed to: ${passkey.name}`, {
        passkeyId,
      }, ipAddress, userAgent);

      return AuthResponseFactory.successByKey('PASSKEY_RENAMED', passkey);
    } catch (error) {
      this.logger.error(`Renaming passkey ${passkeyId} failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Removes one of the caller's passkeys; it stops working for sign-in at
   * once. Losing a passkey is a security event, so this needs a sign-in from
   * the last few minutes: an old or stolen session can't strip the account's
   * passkeys.
   */
  async removePasskey(
    requester: PasskeyRequester,
    passkeyId: string,
    ipAddress: string,
    userAgent: string,
    now: Date = new Date()
  ): Promise<ResponseDto> {
    const userId = requester.id;
    try {
      const signedInAt = requester.authenticatedAt?.getTime();
      if (!signedInAt || now.getTime() - signedInAt > PASSKEY_REMOVAL_REAUTH_WINDOW_MS) {
        return AuthResponseFactory.errorByKey('PASSKEY_REAUTH_REQUIRED', { reauthRequired: true });
      }

      const passkey = await this.prisma.db.passkey.findFirst({
        where: { id: passkeyId, userId },
        select: { id: true, name: true },
      });
      if (!passkey) {
        return AuthResponseFactory.errorByKey('PASSKEY_NOT_FOUND');
      }

      // deleteMany keeps the owner in the condition even at the final write.
      await this.prisma.db.passkey.deleteMany({ where: { id: passkeyId, userId } });
      await this.logPasskeyAction(LogsActionType.PasskeyRemove, userId, `Passkey removed: ${passkey.name}`, {
        passkeyId,
      }, ipAddress, userAgent);

      return AuthResponseFactory.successByKey('PASSKEY_REMOVED', { id: passkeyId });
    } catch (error) {
      this.logger.error(`Removing passkey ${passkeyId} failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR');
    }
  }

  private async logPasskeyAction(
    actionType: LogsActionType,
    userId: string,
    details: string,
    metadata: Record<string, string>,
    ipAddress: string,
    userAgent: string
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
