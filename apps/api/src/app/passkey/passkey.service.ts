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
  ResponseDto,
  UserRole,
  VerifyPasskeyRegistrationDto,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseFactory } from '../auth/helpers/auth-response.factory';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_PASSKEY_NAME = 'Passkey';

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
}
