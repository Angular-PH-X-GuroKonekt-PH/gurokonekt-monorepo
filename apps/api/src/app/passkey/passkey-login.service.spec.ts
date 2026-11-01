import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { API_RESPONSE, LogsActionType, ResponseStatus } from '@gurokonekt/models';

import { PasskeyLoginService, signInBlockFor } from './passkey-login.service';

jest.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

const generateOptions = generateAuthenticationOptions as jest.Mock;
const verifyResponse = verifyAuthenticationResponse as jest.Mock;

const b64url = (value: string) => Buffer.from(value).toString('base64url');
const browserResponse = (overrides: { challenge?: string; userHandle?: string | null; id?: string } = {}) => ({
  id: overrides.id ?? 'cred-1',
  rawId: overrides.id ?? 'cred-1',
  type: 'public-key',
  response: {
    clientDataJSON: b64url(JSON.stringify({ type: 'webauthn.get', challenge: overrides.challenge ?? 'server-challenge' })),
    authenticatorData: 'x',
    signature: 'x',
    ...(overrides.userHandle === null ? {} : { userHandle: b64url(overrides.userHandle ?? 'user-1') }),
  },
});

describe('PasskeyLoginService', () => {
  const user = {
    id: 'user-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Dela Cruz',
    role: 'mentee',
    status: 'active',
    isProfileComplete: true,
    isMentorProfileComplete: false,
  };
  const passkey = {
    id: 'passkey-1',
    userId: 'user-1',
    credentialId: 'cred-1',
    publicKey: Buffer.from([1, 2, 3]),
    counter: BigInt(4),
    transports: ['internal'],
  };
  const session = { access_token: 'access-token', refresh_token: 'refresh-token' };

  const prisma = {
    db: {
      passkeyChallenge: { deleteMany: jest.fn(), create: jest.fn() },
      passkey: { findUnique: jest.fn(), update: jest.fn() },
      user: { findUnique: jest.fn() },
      logs: { create: jest.fn() },
    },
  };
  const supabase = { createSessionForVerifiedUser: jest.fn() };
  const service = new PasskeyLoginService(prisma as any, supabase as any);

  const signIn = (response: object = browserResponse()) =>
    service.verifyAuthentication({ response: response as Record<string, unknown> }, '127.0.0.1', 'Jest');

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.db.passkeyChallenge.deleteMany.mockResolvedValue({ count: 1 });
    prisma.db.passkey.findUnique.mockResolvedValue(passkey);
    prisma.db.user.findUnique.mockResolvedValue(user);
    supabase.createSessionForVerifiedUser.mockResolvedValue(session);
    generateOptions.mockResolvedValue({ challenge: 'server-challenge', rpId: 'localhost' });
    verifyResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 5, credentialBackedUp: true },
    });
  });

  describe('getAuthenticationOptions', () => {
    it('asks for a user-verified passkey without needing an email, and stores a 5-minute challenge', async () => {
      const response = await service.getAuthenticationOptions();

      expect(response.status).toBe(ResponseStatus.Success);
      expect(generateOptions).toHaveBeenCalledWith({ rpID: 'localhost', userVerification: 'required', timeout: 300000 });
      expect(generateOptions.mock.calls[0][0]).not.toHaveProperty('allowCredentials');
      expect(prisma.db.passkeyChallenge.create.mock.calls[0][0].data).toEqual(
        expect.objectContaining({ challenge: 'server-challenge', type: 'authentication' })
      );
    });
  });

  describe('verifyAuthentication', () => {
    it('signs the person in with a normal session, same shape as password login', async () => {
      const response = await signIn();

      expect(verifyResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'server-challenge',
          expectedOrigin: ['http://localhost:4200'],
          expectedRPID: 'localhost',
          requireUserVerification: true,
          credential: { id: 'cred-1', publicKey: new Uint8Array([1, 2, 3]), counter: 4, transports: ['internal'] },
        })
      );
      expect(supabase.createSessionForVerifiedUser).toHaveBeenCalledWith('jane@example.com');
      expect(response.status).toBe(ResponseStatus.Success);
      expect(response.data).toEqual({ user, session, redirectUrl: null });
    });

    it('records the new signature counter and when the passkey was last used', async () => {
      await signIn();

      expect(prisma.db.passkey.update).toHaveBeenCalledWith({
        where: { id: 'passkey-1' },
        data: { counter: BigInt(5), backedUp: true, lastUsedAt: expect.any(Date) },
      });
      expect(prisma.db.logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionType: LogsActionType.SignInPasskey,
          metadata: { outcome: 'success', passkeyId: 'passkey-1' },
        }),
      });
    });

    it('uses each challenge once', async () => {
      await signIn();

      expect(prisma.db.passkeyChallenge.deleteMany).toHaveBeenCalledWith({
        where: { challenge: 'server-challenge', type: 'authentication', expiresAt: { gt: expect.any(Date) } },
      });
    });

    it.each([
      ['the challenge expired or was already used', () => prisma.db.passkeyChallenge.deleteMany.mockResolvedValue({ count: 0 })],
      ['the passkey is unknown or was removed', () => prisma.db.passkey.findUnique.mockResolvedValue(null)],
      ['the signature does not verify', () => verifyResponse.mockResolvedValue({ verified: false, authenticationInfo: {} })],
      ['the counter went backwards (cloned authenticator)', () => verifyResponse.mockRejectedValue(new Error('counter'))],
    ])('rejects when %s, with the same generic answer and no session', async (_case, arrange) => {
      arrange();

      const response = await signIn();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_SIGNIN_FAILED.code);
      expect(response.message).toBe(API_RESPONSE.ERROR.PASSKEY_SIGNIN_FAILED.message);
      expect(response.data).toBeNull();
      expect(supabase.createSessionForVerifiedUser).not.toHaveBeenCalled();
    });

    it("rejects a passkey that claims a different account than it belongs to", async () => {
      const response = await signIn(browserResponse({ userHandle: 'someone-else' }));

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_SIGNIN_FAILED.code);
      expect(verifyResponse).not.toHaveBeenCalled();
    });

    it('rejects a response whose client data has no challenge', async () => {
      const response = await signIn({ ...browserResponse(), response: { clientDataJSON: 'not-json' } });

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.PASSKEY_SIGNIN_FAILED.code);
      expect(prisma.db.passkey.findUnique).not.toHaveBeenCalled();
    });

    it.each([
      ['mentor', 'pending_approval', 'SIGNIN_MENTOR_PENDING_REVIEW'],
      ['mentor', 'rejected', 'SIGNIN_MENTOR_REJECTED'],
      ['mentee', 'banned', 'SIGNIN_ACCOUNT_BLOCKED'],
    ] as const)('keeps the login rules: a %s with status %s is refused', async (role, status, errorKey) => {
      prisma.db.user.findUnique.mockResolvedValue({ ...user, role, status });

      const response = await signIn();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR[errorKey].code);
      expect(supabase.createSessionForVerifiedUser).not.toHaveBeenCalled();
    });

    it('never writes credential material to the logs', async () => {
      prisma.db.passkey.findUnique.mockResolvedValue(null);
      await signIn();

      const logged = JSON.stringify(prisma.db.logs.create.mock.calls);
      expect(logged).not.toContain('cred-1');
      expect(logged).not.toContain('server-challenge');
    });
  });
});

describe('signInBlockFor', () => {
  it.each([
    [{ role: 'mentee', status: 'active' }, null],
    [{ role: 'mentee', status: 'inactive' }, null],
    [{ role: 'mentor', status: 'approved' }, null],
    [{ role: 'mentor', status: 'pending_review' }, 'SIGNIN_MENTOR_PENDING_REVIEW'],
    [{ role: 'mentee', status: 'suspended' }, 'SIGNIN_ACCOUNT_BLOCKED'],
    [{ role: 'admin', status: 'active' }, 'PASSKEY_SIGNIN_FAILED'],
  ])('%j -> %s', (user, expected) => {
    expect(signInBlockFor(user)).toBe(expected);
  });
});
