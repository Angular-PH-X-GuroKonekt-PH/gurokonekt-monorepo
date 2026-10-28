import { API_RESPONSE, LogsActionType, ResponseStatus } from '@gurokonekt/models';

import { SIGN_IN_METHOD_REAUTH_WINDOW_MS, SignInMethodsService } from './sign-in-methods.service';

describe('SignInMethodsService', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  const freshSession = { access_token: 'new-access', refresh_token: 'new-refresh', user: { id: 'user-1' } };
  const googleIdentity = { provider: 'google', identity_id: 'google-identity-1', identity_data: { email: 'jane.personal@gmail.com' } };
  const passwordIdentity = { provider: 'email', identity_data: { email: 'jane@example.com' } };

  const prisma = { db: { passkey: { count: jest.fn() }, logs: { create: jest.fn() }, user: { update: jest.fn() } } };
  const supabase = {
    clientAdmin: { auth: { admin: { getUserById: jest.fn() } } },
    linkGoogleWithSession: jest.fn(),
    unlinkIdentityWithSession: jest.fn(),
  };
  const service = new SignInMethodsService(prisma as any, supabase as any);

  const requester = (minutesSinceSignIn = 2) => ({
    id: 'user-1',
    accessToken: 'access-token',
    authenticatedAt: new Date(now.getTime() - minutesSinceSignIn * 60 * 1000),
  });
  const withIdentities = (identities: object[]) =>
    supabase.clientAdmin.auth.admin.getUserById.mockResolvedValue({ data: { user: { id: 'user-1', identities } }, error: null });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.db.passkey.count.mockResolvedValue(2);
    withIdentities([passwordIdentity]);
    supabase.linkGoogleWithSession.mockResolvedValue({ session: freshSession, error: null });
    supabase.unlinkIdentityWithSession.mockResolvedValue(freshSession);
  });

  it('lists password, Google and passkeys for the account', async () => {
    withIdentities([passwordIdentity, googleIdentity]);

    const response = await service.listMethods('user-1');

    expect(response.data).toEqual({
      password: true,
      google: { connected: true, email: 'jane.personal@gmail.com' },
      passkeys: 2,
    });
  });

  describe('connectGoogle', () => {
    const connect = (who = requester()) =>
      service.connectGoogle(who, { idToken: 'google-id-token', refreshToken: 'refresh-token' }, '127.0.0.1', 'Jest', now);

    it("links Google to the signed-in user's own session and returns fresh tokens", async () => {
      withIdentities([passwordIdentity, googleIdentity]);

      const response = await connect();

      expect(supabase.linkGoogleWithSession).toHaveBeenCalledWith(
        { access_token: 'access-token', refresh_token: 'refresh-token' },
        'google-id-token',
        undefined
      );
      expect(response.status).toBe(ResponseStatus.Success);
      expect(response.data).toEqual({
        methods: { password: true, google: { connected: true, email: 'jane.personal@gmail.com' }, passkeys: 2 },
        session: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      });
      expect(prisma.db.logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actionType: LogsActionType.GoogleConnect, targetId: 'user-1' }),
      });
      // Remembered so signing in with it isn't treated as automatic email-match linking.
      expect(prisma.db.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { googleIdentityId: 'google-identity-1' },
      });
    });

    it('needs a sign-in from the last 10 minutes', async () => {
      const response = await connect(requester(SIGN_IN_METHOD_REAUTH_WINDOW_MS / 60000 + 1));

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.SIGN_IN_METHOD_REAUTH_REQUIRED.code);
      expect(response.data).toEqual({ reauthRequired: true });
      expect(supabase.linkGoogleWithSession).not.toHaveBeenCalled();
    });

    it.each([
      ['identity_already_exists', 'GOOGLE_ALREADY_LINKED'],
      ['manual_linking_disabled', 'GOOGLE_LINKING_UNAVAILABLE'],
      ['bad_jwt', 'GOOGLE_LINK_FAILED'],
    ] as const)('maps Supabase error %s to %s', async (code, errorKey) => {
      supabase.linkGoogleWithSession.mockResolvedValue({ session: null, error: { code, message: code } });

      const response = await connect();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR[errorKey].code);
      expect(prisma.db.logs.create).not.toHaveBeenCalled();
    });

    it("refuses if the linked session isn't the signed-in user's", async () => {
      supabase.linkGoogleWithSession.mockResolvedValue({ session: { ...freshSession, user: { id: 'someone-else' } }, error: null });

      const response = await connect();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.GOOGLE_LINK_FAILED.code);
    });
  });

  describe('disconnectGoogle', () => {
    const disconnect = (who = requester()) =>
      service.disconnectGoogle(who, { refreshToken: 'refresh-token' }, '127.0.0.1', 'Jest', now);

    it('unlinks Google when the account still has a password', async () => {
      withIdentities([passwordIdentity, googleIdentity]);

      const response = await disconnect();

      expect(supabase.unlinkIdentityWithSession).toHaveBeenCalledWith(
        { access_token: 'access-token', refresh_token: 'refresh-token' },
        googleIdentity
      );
      expect(response.message).toBe(API_RESPONSE.SUCCESS.GOOGLE_DISCONNECTED.message);
      expect(prisma.db.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { googleIdentityId: null } });
      expect(prisma.db.logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ actionType: LogsActionType.GoogleDisconnect }),
      });
    });

    it('keeps Google when it is the only way to sign in', async () => {
      withIdentities([googleIdentity]);

      const response = await disconnect();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.GOOGLE_DISCONNECT_NOT_ALLOWED.code);
      expect(supabase.unlinkIdentityWithSession).not.toHaveBeenCalled();
    });

    it("reports when Google isn't connected", async () => {
      const response = await disconnect();

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.GOOGLE_NOT_LINKED.code);
    });

    it('needs a sign-in from the last 10 minutes', async () => {
      withIdentities([passwordIdentity, googleIdentity]);

      const response = await disconnect(requester(30));

      expect(response.statusCode).toBe(API_RESPONSE.ERROR.SIGN_IN_METHOD_REAUTH_REQUIRED.code);
      expect(supabase.unlinkIdentityWithSession).not.toHaveBeenCalled();
    });
  });
});
