import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { API_RESPONSE, LogsActionType, ResponseStatus } from '@gurokonekt/models';

import { PASSKEY_REMOVAL_REAUTH_WINDOW_MS, PasskeyService, readPasskeyConfig } from './passkey.service';

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
}));

const generateOptions = generateRegistrationOptions as jest.Mock;
const verifyResponse = verifyRegistrationResponse as jest.Mock;

describe('PasskeyService', () => {
  const user = { id: 'user-1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Dela Cruz', role: 'mentee' };
  const challengeRow = { id: 'challenge-1', challenge: 'server-challenge', userId: 'user-1' };
  const browserResponse = { id: 'cred-1', rawId: 'cred-1', type: 'public-key', response: {} };
  const verified = {
    verified: true,
    registrationInfo: {
      credential: { id: 'cred-1', publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['internal', 'hybrid'] },
      credentialDeviceType: 'multiDevice',
      credentialBackedUp: true,
      aaguid: 'fbfc3007-154e-4ecc-8c0b-6e020557d7bd',
    },
  };

  const prisma = {
    db: {
      user: { findUnique: jest.fn() },
      passkey: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      passkeyChallenge: { deleteMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
      logs: { create: jest.fn() },
    },
  };
  const service = new PasskeyService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.db.user.findUnique.mockResolvedValue(user);
    prisma.db.passkey.findMany.mockResolvedValue([{ credentialId: 'existing-cred', transports: ['usb'] }]);
    prisma.db.passkey.findUnique.mockResolvedValue(null);
    prisma.db.passkey.create.mockImplementation(async ({ data }) => ({
      id: 'passkey-1',
      name: data.name,
      deviceType: data.deviceType,
      backedUp: data.backedUp,
      createdAt: new Date('2026-10-08T00:00:00Z'),
    }));
    prisma.db.passkeyChallenge.findFirst.mockResolvedValue(challengeRow);
    generateOptions.mockResolvedValue({ challenge: 'server-challenge', rp: { id: 'localhost' } });
    verifyResponse.mockResolvedValue(verified);
  });

  describe('getRegistrationOptions', () => {
    it('asks for a discoverable, user-verified passkey and skips ones the user already has', async () => {
      const response = await service.getRegistrationOptions('user-1');

      expect(response.status).toBe(ResponseStatus.Success);
      expect(generateOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: 'localhost',
          userName: 'jane@example.com',
          userDisplayName: 'Jane Dela Cruz',
          userID: new TextEncoder().encode('user-1'),
          attestationType: 'none',
          excludeCredentials: [{ id: 'existing-cred', transports: ['usb'] }],
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        })
      );
    });

    it('stores a 5-minute challenge and replaces any earlier attempt', async () => {
      const before = Date.now();
      await service.getRegistrationOptions('user-1');

      expect(prisma.db.passkeyChallenge.deleteMany).toHaveBeenCalledWith({
        where: { OR: [{ userId: 'user-1', type: 'registration' }, { expiresAt: { lt: expect.any(Date) } }] },
      });
      const { data } = prisma.db.passkeyChallenge.create.mock.calls[0][0];
      expect(data).toEqual(expect.objectContaining({ userId: 'user-1', challenge: 'server-challenge', type: 'registration' }));
      expect(data.expiresAt.getTime() - before).toBeGreaterThanOrEqual(5 * 60 * 1000 - 50);
      expect(data.expiresAt.getTime() - before).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);
    });

    it('is not available to admins', async () => {
      prisma.db.user.findUnique.mockResolvedValue({ ...user, role: 'admin' });

      const response = await service.getRegistrationOptions('user-1');

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_NOT_AVAILABLE.code);
      expect(generateOptions).not.toHaveBeenCalled();
    });
  });

  describe('verifyRegistration', () => {
    const verify = (name?: string) =>
      service.verifyRegistration('user-1', { response: browserResponse, name }, '127.0.0.1', 'Jest');

    it('saves only the public key and returns a summary without key material', async () => {
      const response = await verify('  Chrome on Windows  ');

      expect(verifyResponse).toHaveBeenCalledWith({
        response: browserResponse,
        expectedChallenge: 'server-challenge',
        expectedOrigin: ['http://localhost:4200'],
        expectedRPID: 'localhost',
        requireUserVerification: true,
      });
      const { data } = prisma.db.passkey.create.mock.calls[0][0];
      expect(data).toEqual({
        userId: 'user-1',
        credentialId: 'cred-1',
        publicKey: Buffer.from([1, 2, 3]),
        counter: BigInt(0),
        transports: ['internal', 'hybrid'],
        deviceType: 'multiDevice',
        backedUp: true,
        aaguid: 'fbfc3007-154e-4ecc-8c0b-6e020557d7bd',
        name: 'Chrome on Windows',
      });
      expect(response.status).toBe(ResponseStatus.Success);
      expect(response.message).toBe(API_RESPONSE.SUCCESS.PASSKEY_REGISTERED.message);
      expect(response.data).not.toHaveProperty('publicKey');
      expect(prisma.db.logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actionType: LogsActionType.PasskeyRegister, targetId: 'user-1' }),
      });
    });

    it('uses a default name and drops an all-zero authenticator ID', async () => {
      verifyResponse.mockResolvedValue({
        ...verified,
        registrationInfo: { ...verified.registrationInfo, aaguid: '00000000-0000-0000-0000-000000000000' },
      });

      await verify();

      expect(prisma.db.passkey.create.mock.calls[0][0].data).toEqual(
        expect.objectContaining({ name: 'Passkey', aaguid: null })
      );
    });

    it('refuses when the setup took too long or was never started', async () => {
      prisma.db.passkeyChallenge.findFirst.mockResolvedValue(null);

      const response = await verify();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_CHALLENGE_EXPIRED.code);
      expect(verifyResponse).not.toHaveBeenCalled();
    });

    it.each([
      ['the response does not verify', () => verifyResponse.mockResolvedValue({ verified: false })],
      ['the response is malformed or for another site', () => verifyResponse.mockRejectedValue(new Error('Unexpected origin'))],
    ])('rejects when %s, and the challenge cannot be reused', async (_case, arrange) => {
      arrange();

      const response = await verify();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_VERIFICATION_FAILED.code);
      expect(prisma.db.passkeyChallenge.delete).toHaveBeenCalledWith({ where: { id: 'challenge-1' } });
      expect(prisma.db.passkey.create).not.toHaveBeenCalled();
    });

    it('refuses a passkey that is already saved', async () => {
      prisma.db.passkey.findUnique.mockResolvedValue({ id: 'existing' });

      const response = await verify();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_ALREADY_REGISTERED.code);
      expect(prisma.db.passkey.create).not.toHaveBeenCalled();
    });

    it('treats a duplicate saved at the same moment as already added', async () => {
      prisma.db.passkey.create.mockRejectedValue({ code: 'P2002' });

      const response = await verify();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_ALREADY_REGISTERED.code);
    });
  });
});

describe('PasskeyService management', () => {
  const summary = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Work laptop',
    deviceType: 'singleDevice',
    backedUp: false,
    createdAt: new Date('2026-10-08T00:00:00Z'),
    lastUsedAt: null,
  };
  const prisma = {
    db: {
      passkey: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      logs: { create: jest.fn() },
    },
  };
  const service = new PasskeyService(prisma as any);
  const now = new Date('2026-10-08T12:00:00Z');
  const signedInMinutesAgo = (minutes: number) => ({
    id: 'user-1',
    authenticatedAt: new Date(now.getTime() - minutes * 60 * 1000),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.db.passkey.findMany.mockResolvedValue([summary]);
    prisma.db.passkey.findFirst.mockResolvedValue({ id: summary.id, name: summary.name });
    prisma.db.passkey.findUniqueOrThrow.mockResolvedValue(summary);
    prisma.db.passkey.updateMany.mockResolvedValue({ count: 1 });
    prisma.db.passkey.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("lists only the caller's passkeys, newest first, without key material", async () => {
    const response = await service.listPasskeys('user-1');

    expect(prisma.db.passkey.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, deviceType: true, backedUp: true, createdAt: true, lastUsedAt: true },
    });
    expect(response.data).toEqual([summary]);
  });

  it('renames a passkey and logs it', async () => {
    const response = await service.renamePasskey('user-1', summary.id, { name: 'Work laptop' }, '127.0.0.1', 'Jest');

    expect(prisma.db.passkey.updateMany).toHaveBeenCalledWith({
      where: { id: summary.id, userId: 'user-1' },
      data: { name: 'Work laptop' },
    });
    expect(response.message).toBe(API_RESPONSE.SUCCESS.PASSKEY_RENAMED.message);
    expect(prisma.db.logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: LogsActionType.PasskeyRename, targetId: 'user-1' }),
    });
  });

  it("can't rename another user's passkey", async () => {
    prisma.db.passkey.updateMany.mockResolvedValue({ count: 0 });

    const response = await service.renamePasskey('intruder', summary.id, { name: 'Mine now' }, '127.0.0.1', 'Jest');

    expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_NOT_FOUND.code);
    expect(prisma.db.logs.create).not.toHaveBeenCalled();
  });

  it('removes a passkey right after a fresh sign-in, so it stops working at once', async () => {
    const response = await service.removePasskey(signedInMinutesAgo(2), summary.id, '127.0.0.1', 'Jest', now);

    expect(prisma.db.passkey.deleteMany).toHaveBeenCalledWith({ where: { id: summary.id, userId: 'user-1' } });
    expect(response.message).toBe(API_RESPONSE.SUCCESS.PASSKEY_REMOVED.message);
    expect(prisma.db.logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actionType: LogsActionType.PasskeyRemove }),
    });
  });

  it.each([
    ['the sign-in is older than 10 minutes', signedInMinutesAgo(PASSKEY_REMOVAL_REAUTH_WINDOW_MS / 60000 + 1)],
    ['the session has no sign-in time', { id: 'user-1', authenticatedAt: null }],
  ])('asks to sign in again when %s', async (_case, requester) => {
    const response = await service.removePasskey(requester, summary.id, '127.0.0.1', 'Jest', now);

    expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_REAUTH_REQUIRED.code);
    expect(response.data).toEqual({ reauthRequired: true });
    expect(prisma.db.passkey.deleteMany).not.toHaveBeenCalled();
  });

  it("can't remove another user's passkey", async () => {
    prisma.db.passkey.findFirst.mockResolvedValue(null);

    const response = await service.removePasskey(
      { id: 'intruder', authenticatedAt: now },
      summary.id,
      '127.0.0.1',
      'Jest',
      now
    );

    expect(prisma.db.passkey.findFirst).toHaveBeenCalledWith({
      where: { id: summary.id, userId: 'intruder' },
      select: { id: true, name: true },
    });
    expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_NOT_FOUND.code);
    expect(prisma.db.passkey.deleteMany).not.toHaveBeenCalled();
  });
});

describe('readPasskeyConfig', () => {
  it('defaults to the local web app', () => {
    expect(readPasskeyConfig({})).toEqual({
      rpName: 'GuroKonekt',
      rpID: 'localhost',
      origins: ['http://localhost:4200'],
    });
  });

  it('reads the domain and a comma-separated list of web app URLs', () => {
    expect(
      readPasskeyConfig({
        WEBAUTHN_RP_ID: 'gurokonekt.com',
        WEBAUTHN_ORIGINS: 'https://portal.gurokonekt.com, https://test-portal.gurokonekt.com',
      })
    ).toEqual({
      rpName: 'GuroKonekt',
      rpID: 'gurokonekt.com',
      origins: ['https://portal.gurokonekt.com', 'https://test-portal.gurokonekt.com'],
    });
  });
});
