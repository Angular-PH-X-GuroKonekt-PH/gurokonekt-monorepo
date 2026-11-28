import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { API_RESPONSE, AUTH_SETUP_REQUIRED_ERROR_CODE, LogsActionType } from '@gurokonekt/models';
import { AuthRequirementsService, buildStatus } from './auth-requirements.service';
import { JwtGuardGuard } from '../jwt-guard/jwt-guard.guard';
import { ALLOW_INCOMPLETE_AUTH_SETUP } from './allow-incomplete-auth-setup.decorator';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_ID = '22222222-2222-2222-2222-222222222222';
const ALL_ON = { passkeyRequired: true, googleRequired: true };
const ALL_OFF = { passkeyRequired: false, googleRequired: false };

function setup() {
  const prisma = {
    db: {
      $queryRaw: jest.fn(),
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
      passkey: { count: jest.fn() },
      authenticationSettings: { findUnique: jest.fn(), upsert: jest.fn() },
      user: { update: jest.fn() },
      logs: { create: jest.fn() },
    },
  };
  const supabase = { clientAdmin: { auth: { admin: { updateUserById: jest.fn().mockResolvedValue({ error: null }) } } } };
  const service = new AuthRequirementsService(prisma as never, supabase as never);
  const account = (has: { password: boolean; google: boolean; passkeys: number }, settings = ALL_ON) => {
    prisma.db.authenticationSettings.findUnique.mockResolvedValue(settings);
    prisma.db.$queryRaw.mockResolvedValue([{ hasPassword: has.password, hasGoogle: has.google }]);
    prisma.db.passkey.count.mockResolvedValue(has.passkeys);
  };
  return { prisma, supabase, service, account };
}

describe('buildStatus', () => {
  it('always requires a password', () => {
    const status = buildStatus(USER_ID, ALL_OFF, { password: false, passkey: true, google: true });
    expect(status.missingRequirements).toEqual(['PASSWORD']);
    expect(status.requirementsCompleted).toBe(false);
  });

  it('lists every missing required method', () => {
    const status = buildStatus(USER_ID, ALL_ON, { password: true, passkey: false, google: false });
    expect(status.missingRequirements).toEqual(['PASSKEY', 'GOOGLE_IDP']);
  });

  it('ignores methods that are not required', () => {
    const status = buildStatus(USER_ID, ALL_OFF, { password: true, passkey: false, google: false });
    expect(status.requirementsCompleted).toBe(true);
    expect(status.missingRequirements).toEqual([]);
  });

  it('passes the example from the ticket only once the passkey is added', () => {
    expect(buildStatus(USER_ID, ALL_ON, { password: true, passkey: false, google: true }).missingRequirements).toEqual([
      'PASSKEY',
    ]);
    expect(buildStatus(USER_ID, ALL_ON, { password: true, passkey: true, google: true }).requirementsCompleted).toBe(true);
  });
});

describe('AuthRequirementsService', () => {
  it('reads the account from Supabase records and passkeys', async () => {
    const { service, account } = setup();
    account({ password: true, google: false, passkeys: 2 });

    const status = await service.getStatus(USER_ID);

    expect(status).toEqual(
      expect.objectContaining({
        usernamePasswordConfigured: true,
        passkeyConfigured: true,
        googleIdpConnected: false,
        missingRequirements: ['GOOGLE_IDP'],
      })
    );
  });

  it('treats an unknown auth user as having nothing', async () => {
    const { service, account, prisma } = setup();
    account({ password: true, google: true, passkeys: 0 });
    prisma.db.$queryRaw.mockResolvedValue([]);

    expect((await service.getStatus(USER_ID)).missingRequirements).toEqual(['PASSWORD', 'PASSKEY', 'GOOGLE_IDP']);
  });

  it('falls back to requiring everything when the settings row is missing', async () => {
    const { service, account, prisma } = setup();
    account({ password: true, google: false, passkeys: 0 });
    prisma.db.authenticationSettings.findUnique.mockResolvedValue(null);

    expect((await service.getStatus(USER_ID)).missingRequirements).toEqual(['PASSKEY', 'GOOGLE_IDP']);
  });

  it('caches an answer briefly and re-reads it once invalidated', async () => {
    const { service, account, prisma } = setup();
    account({ password: true, google: true, passkeys: 0 });
    await service.getStatus(USER_ID, 1000);
    prisma.db.passkey.count.mockResolvedValue(1);

    expect((await service.getStatus(USER_ID, 2000)).requirementsCompleted).toBe(false);
    service.invalidate(USER_ID);
    expect((await service.getStatus(USER_ID, 3000)).requirementsCompleted).toBe(true);
  });

  it('expires the cache after 30 seconds', async () => {
    const { service, account, prisma } = setup();
    account({ password: true, google: true, passkeys: 0 });
    await service.getStatus(USER_ID, 1000);
    prisma.db.passkey.count.mockResolvedValue(1);

    expect((await service.getStatus(USER_ID, 1000 + 31_000)).requirementsCompleted).toBe(true);
  });

  it('getMyStatus always reads fresh', async () => {
    const { service, account, prisma } = setup();
    account({ password: true, google: true, passkeys: 0 });
    await service.getStatus(USER_ID);
    prisma.db.passkey.count.mockResolvedValue(1);

    const response = await service.getMyStatus(USER_ID);

    expect(response.statusCode).toBe(API_RESPONSE.SUCCESS.AUTH_SETUP_STATUS.code);
    expect((response.data as { requirementsCompleted: boolean }).requirementsCompleted).toBe(true);
  });

  it('getMyStatus reports a failure instead of throwing', async () => {
    const { service, prisma } = setup();
    prisma.db.authenticationSettings.findUnique.mockRejectedValue(new Error('db down'));

    expect((await service.getMyStatus(USER_ID)).statusCode).toBe(API_RESPONSE.ERROR.AUTH_SETUP_STATUS.code);
  });

  describe('setPassword', () => {
    const dto = { newPassword: 'Str0ng!Passw0rd', confirmPassword: 'Str0ng!Passw0rd' };
    const recent = { id: USER_ID, authenticatedAt: new Date() };

    it('sets a first password for a Google-only account and logs it', async () => {
      const { service, account, supabase, prisma } = setup();
      account({ password: false, google: true, passkeys: 1 });
      supabase.clientAdmin.auth.admin.updateUserById.mockImplementation(async () => {
        prisma.db.$queryRaw.mockResolvedValue([{ hasPassword: true, hasGoogle: true }]);
        return { error: null };
      });

      const response = await service.setPassword(recent, dto, '1.1.1.1', 'jest');

      expect(response.statusCode).toBe(API_RESPONSE.SUCCESS.PASSWORD_SET.code);
      expect(supabase.clientAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(USER_ID, { password: dto.newPassword });
      expect(prisma.db.user.update).toHaveBeenCalledWith({ where: { id: USER_ID }, data: { hashPassword: expect.any(String) } });
      expect(prisma.db.logs.create.mock.calls[0][0].data.actionType).toBe(LogsActionType.PasswordSet);
      expect((response.data as { requirementsCompleted: boolean }).requirementsCompleted).toBe(true);
    });

    it('refuses when the account already has a password', async () => {
      const { service, account, supabase } = setup();
      account({ password: true, google: true, passkeys: 0 });

      const response = await service.setPassword(recent, dto, '', '');

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSWORD_ALREADY_SET.code);
      expect(supabase.clientAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
    });

    it('needs a recent sign-in', async () => {
      const { service, account, supabase } = setup();
      account({ password: false, google: true, passkeys: 0 });

      const response = await service.setPassword({ id: USER_ID, authenticatedAt: new Date(Date.now() - 11 * 60 * 1000) }, dto, '', '');

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.SIGN_IN_METHOD_REAUTH_REQUIRED.code);
      expect(response.data).toEqual({ reauthRequired: true });
      expect(supabase.clientAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
    });

    it('does not touch the database when Supabase rejects the password', async () => {
      const { service, account, supabase, prisma } = setup();
      account({ password: false, google: true, passkeys: 0 });
      supabase.clientAdmin.auth.admin.updateUserById.mockResolvedValue({ error: { message: 'weak' } });

      const response = await service.setPassword(recent, dto, '', '');

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSWORD_SET.code);
      expect(prisma.db.user.update).not.toHaveBeenCalled();
    });
  });

  describe('settings', () => {
    it('always reports email and password as required', async () => {
      const { service, prisma } = setup();
      prisma.db.authenticationSettings.findUnique.mockResolvedValue({ ...ALL_OFF, updatedAt: null, updatedBy: null });

      const response = await service.getSettings();

      expect(response.data).toEqual(
        expect.objectContaining({ usernamePasswordRequired: true, passkeyRequired: false, googleIdpRequired: false })
      );
    });

    it('saves, logs before and after, and applies to cached accounts at once', async () => {
      const { service, account, prisma } = setup();
      account({ password: true, google: false, passkeys: 0 }, ALL_ON);
      expect((await service.getStatus(USER_ID)).requirementsCompleted).toBe(false);
      prisma.db.authenticationSettings.findUnique.mockResolvedValue(ALL_OFF);

      const response = await service.updateSettings(ADMIN_ID, { passkeyRequired: false, googleIdpRequired: false }, '', '');

      expect(response.statusCode).toBe(API_RESPONSE.SUCCESS.AUTH_SETTINGS_UPDATED.code);
      expect(prisma.db.authenticationSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { passkeyRequired: false, googleRequired: false, updatedById: ADMIN_ID } })
      );
      const log = prisma.db.logs.create.mock.calls[0][0].data;
      expect(log.actionType).toBe(LogsActionType.AdminUpdateAuthSettings);
      expect(log.createdById).toBe(ADMIN_ID);
      expect(log.metadata.after).toEqual({ passkeyRequired: false, googleIdpRequired: false });
      expect((await service.getStatus(USER_ID)).requirementsCompleted).toBe(true);
    });
  });
});

describe('JwtGuardGuard setup check', () => {
  const context = (user = { id: USER_ID }) =>
    ({
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  function guard(setupRoute: boolean, completed: boolean) {
    const reflector = { getAllAndOverride: jest.fn((key: string) => (key === ALLOW_INCOMPLETE_AUTH_SETUP ? setupRoute : undefined)) };
    const requirements = {
      getStatus: jest.fn().mockResolvedValue({ requirementsCompleted: completed, missingRequirements: completed ? [] : ['PASSKEY'] }),
    };
    jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockResolvedValue(true);
    return { guard: new JwtGuardGuard(reflector as unknown as Reflector, requirements as never), requirements };
  }

  afterEach(() => jest.restoreAllMocks());

  it('blocks protected routes until setup is finished', async () => {
    const { guard: g } = guard(false, false);

    const error = await g.canActivate(context()).catch((e) => e);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect(error.getResponse()).toEqual(
      expect.objectContaining({ errorCode: AUTH_SETUP_REQUIRED_ERROR_CODE, missingRequirements: ['PASSKEY'] })
    );
  });

  it('lets finished accounts through', async () => {
    const { guard: g } = guard(false, true);
    await expect(g.canActivate(context())).resolves.toBe(true);
  });

  it('keeps setup routes open without checking', async () => {
    const { guard: g, requirements } = guard(true, false);
    await expect(g.canActivate(context())).resolves.toBe(true);
    expect(requirements.getStatus).not.toHaveBeenCalled();
  });
});
