import { Injectable, Logger } from '@nestjs/common';
import bcrypt from 'bcrypt';
import {
  AuthSetupRequirement,
  AuthenticationSettingsInterface,
  LogsActionType,
  ResponseDto,
  SetPasswordDto,
  UpdateAuthenticationSettingsDto,
  UserAuthenticationStatusInterface,
} from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthResponseFactory } from '../auth/helpers/auth-response.factory';
import { isRecentSignIn } from '../sign-in-methods/sign-in-methods.service';

const SETTINGS_ID = 1;
/** Used when the settings row is missing: fail closed, matching the migration's defaults. */
const DEFAULT_SETTINGS = { passkeyRequired: true, googleRequired: true };
// shortcut: per-process cache, so another API instance can lag by up to this long; move to a shared store if the API scales out.
const CACHE_TTL_MS = 30 * 1000;

type Settings = { passkeyRequired: boolean; googleRequired: boolean };

export interface PasswordRequester {
  id: string;
  authenticatedAt?: Date | null;
}

/**
 * Which sign-in methods every account must have (#463) and whether an account
 * has them. Email and password is always required; admins choose whether a
 * passkey and a connected Google account are too. The answer is worked out on
 * each check from the live settings and the account's real sign-in methods,
 * never stored, so a settings change applies to existing sessions at once.
 */
@Injectable()
export class AuthRequirementsService {
  private readonly logger = new Logger(AuthRequirementsService.name);
  private settingsCache: { value: Settings; expiresAt: number } | null = null;
  private readonly statusCache = new Map<string, { value: UserAuthenticationStatusInterface; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService
  ) {}

  /** Used by the JWT guard on every protected request. Throws if the check can't run, so access fails closed. */
  async getStatus(userId: string, now = Date.now()): Promise<UserAuthenticationStatusInterface> {
    const cached = this.statusCache.get(userId);
    if (cached && cached.expiresAt > now) return cached.value;

    const settings = await this.readSettings(now);
    // Supabase's own records: a password hash, and a Google identity. Google-created
    // accounts have no password here even though our users table holds a placeholder hash.
    const [methods] = await this.prisma.db.$queryRaw<{ hasPassword: boolean; hasGoogle: boolean }[]>`
      SELECT coalesce(u.encrypted_password, '') <> '' AS "hasPassword",
             EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'google') AS "hasGoogle"
      FROM auth.users u
      WHERE u.id = ${userId}::uuid`;
    const passkeys = await this.prisma.db.passkey.count({ where: { userId } });

    const status = buildStatus(userId, settings, {
      password: !!methods?.hasPassword,
      passkey: passkeys > 0,
      google: !!methods?.hasGoogle,
    });
    this.statusCache.set(userId, { value: status, expiresAt: now + CACHE_TTL_MS });
    return status;
  }

  /** Call after anything that adds or removes a sign-in method. */
  invalidate(userId: string): void {
    this.statusCache.delete(userId);
  }

  async getMyStatus(userId: string): Promise<ResponseDto> {
    try {
      this.invalidate(userId);
      return AuthResponseFactory.successByKey('AUTH_SETUP_STATUS', await this.getStatus(userId));
    } catch (error) {
      this.logger.error(`Sign-in setup status failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('AUTH_SETUP_STATUS');
    }
  }

  /**
   * Gives a Google-created account its first password. Changing an existing
   * password stays with the emailed reset flow; this only fills a gap, and
   * like linking Google it needs a sign-in from the last 10 minutes.
   */
  async setPassword(
    requester: PasswordRequester,
    dto: SetPasswordDto,
    ipAddress: string,
    userAgent: string,
    now: Date = new Date()
  ): Promise<ResponseDto> {
    const userId = requester.id;
    try {
      if (!isRecentSignIn(requester.authenticatedAt, now)) {
        return AuthResponseFactory.errorByKey('SIGN_IN_METHOD_REAUTH_REQUIRED', { reauthRequired: true });
      }
      this.invalidate(userId);
      if ((await this.getStatus(userId)).usernamePasswordConfigured) {
        return AuthResponseFactory.errorByKey('PASSWORD_ALREADY_SET');
      }

      const { error } = await this.supabase.clientAdmin.auth.admin.updateUserById(userId, {
        password: dto.newPassword,
      });
      if (error) {
        this.logger.error(`Setting a password failed for ${userId}: ${error.message}`);
        return AuthResponseFactory.errorByKey('PASSWORD_SET');
      }

      await this.prisma.db.$transaction([
        this.prisma.db.user.update({
          where: { id: userId },
          data: { hashPassword: await bcrypt.hash(dto.newPassword, 10) },
        }),
        this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.PasswordSet,
            targetId: userId,
            details: 'Password set from sign-in setup',
            ipAddress: ipAddress ?? '',
            userAgent: userAgent ?? '',
            createdById: userId,
          },
        }),
      ]);

      this.invalidate(userId);
      return AuthResponseFactory.successByKey('PASSWORD_SET', await this.getStatus(userId));
    } catch (error) {
      this.logger.error(`Setting a password failed for ${userId}: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('PASSWORD_SET');
    }
  }

  async getSettings(): Promise<ResponseDto> {
    try {
      return AuthResponseFactory.successByKey('AUTH_SETTINGS_RETRIEVED', await this.readSettingsDetail());
    } catch (error) {
      this.logger.error(`Reading authentication settings failed: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('AUTH_SETTINGS_RETRIEVED');
    }
  }

  async updateSettings(
    adminId: string,
    dto: UpdateAuthenticationSettingsDto,
    ipAddress: string,
    userAgent: string
  ): Promise<ResponseDto> {
    try {
      this.settingsCache = null;
      const before = await this.readSettings(Date.now());
      const after = { passkeyRequired: dto.passkeyRequired, googleRequired: dto.googleIdpRequired };

      await this.prisma.db.$transaction([
        this.prisma.db.authenticationSettings.upsert({
          where: { id: SETTINGS_ID },
          create: { id: SETTINGS_ID, ...after, updatedById: adminId },
          update: { ...after, updatedById: adminId },
        }),
        this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.AdminUpdateAuthSettings,
            targetId: String(SETTINGS_ID),
            details: 'Authentication settings updated',
            metadata: {
              before: { passkeyRequired: before.passkeyRequired, googleIdpRequired: before.googleRequired },
              after: { passkeyRequired: after.passkeyRequired, googleIdpRequired: after.googleRequired },
            },
            ipAddress: ipAddress ?? '',
            userAgent: userAgent ?? '',
            createdById: adminId,
          },
        }),
      ]);

      // Every account's answer may have changed.
      this.settingsCache = null;
      this.statusCache.clear();
      return AuthResponseFactory.successByKey('AUTH_SETTINGS_UPDATED', await this.readSettingsDetail());
    } catch (error) {
      this.logger.error(`Saving authentication settings failed: ${(error as Error).message}`);
      return AuthResponseFactory.errorByKey('AUTH_SETTINGS_UPDATED');
    }
  }

  private async readSettings(now: number): Promise<Settings> {
    if (this.settingsCache && this.settingsCache.expiresAt > now) return this.settingsCache.value;
    const row = await this.prisma.db.authenticationSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: { passkeyRequired: true, googleRequired: true },
    });
    const value = row ?? DEFAULT_SETTINGS;
    this.settingsCache = { value, expiresAt: now + CACHE_TTL_MS };
    return value;
  }

  private async readSettingsDetail(): Promise<AuthenticationSettingsInterface> {
    const row = await this.prisma.db.authenticationSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: {
        passkeyRequired: true,
        googleRequired: true,
        updatedAt: true,
        updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    return {
      usernamePasswordRequired: true,
      passkeyRequired: row?.passkeyRequired ?? DEFAULT_SETTINGS.passkeyRequired,
      googleIdpRequired: row?.googleRequired ?? DEFAULT_SETTINGS.googleRequired,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  }
}

export function buildStatus(
  userId: string,
  settings: Settings,
  has: { password: boolean; passkey: boolean; google: boolean }
): UserAuthenticationStatusInterface {
  const missingRequirements: AuthSetupRequirement[] = [];
  if (!has.password) missingRequirements.push('PASSWORD');
  if (settings.passkeyRequired && !has.passkey) missingRequirements.push('PASSKEY');
  if (settings.googleRequired && !has.google) missingRequirements.push('GOOGLE_IDP');
  return {
    userId,
    usernamePasswordConfigured: has.password,
    passkeyConfigured: has.passkey,
    googleIdpConnected: has.google,
    passkeyRequired: settings.passkeyRequired,
    googleIdpRequired: settings.googleRequired,
    requirementsCompleted: missingRequirements.length === 0,
    missingRequirements,
  };
}
