import { Test } from '@nestjs/testing';
import { API_RESPONSE, LogsActionType, ResponseStatus } from '@gurokonekt/models';

import { AuthService, findNewGoogleLink } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { StorageService } from '../storage/storage.service';
import {
  AuthValidationService,
  AuthLoggingService,
  AuthRateLimiterService,
  AuthErrorHandlerService,
} from './helpers';

describe('AuthService.getSession', () => {
  let service: AuthService;
  const findUnique = jest.fn();

  beforeEach(async () => {
    findUnique.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { db: { user: { findUnique } } } },
        { provide: SupabaseService, useValue: { client: {} } },
        { provide: StorageService, useValue: {} },
        { provide: AuthValidationService, useValue: {} },
        { provide: AuthLoggingService, useValue: {} },
        { provide: AuthRateLimiterService, useValue: {} },
        { provide: AuthErrorHandlerService, useValue: { handleUnexpectedError: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('returns the current user in AuthUser shape', async () => {
    findUnique.mockResolvedValue({
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Dela Cruz',
      email: 'jane@example.com',
      role: 'mentor',
      status: 'active',
      isProfileComplete: true,
      isMentorProfileComplete: true,
    });

    const response = await service.getSession('user-1');

    expect(response.status).toBe(ResponseStatus.Success);
    expect(response.statusCode).toBe(200);
    expect(response.data).toEqual({
      id: 'user-1',
      email: 'jane@example.com',
      fullName: 'Jane Dela Cruz',
      role: 'mentor',
      isProfileComplete: true,
      isMentorProfileComplete: true,
    });
  });

  it('returns USER_NOT_FOUND when the token subject no longer exists', async () => {
    findUnique.mockResolvedValue(null);

    const response = await service.getSession('ghost');

    expect(response.status).toBe(ResponseStatus.Error);
    expect(response.statusCode).toBe(API_RESPONSE.ERROR.USER_NOT_FOUND.code);
    expect(response.data).toBeNull();
  });
});

describe('AuthService', () => {
  describe('forgotPassword', () => {
    const storedEmail = 'sagemichvillafranca+testmentor9@gmail.com';
    const submittedEmail = 'SageMichVillafranca+TestMentor9@Gmail.com';
    const user = { id: 'user-id', email: storedEmail };

    const prisma = {
      db: {
        user: { findUnique: jest.fn() },
        logs: { create: jest.fn() },
      },
    };
    const supabase = {
      client: {
        auth: { resetPasswordForEmail: jest.fn() },
      },
    };
    const validation = {
      normalizeEmail: jest.fn((email: string) => email.toLowerCase().trim()),
    };

    const service = new AuthService(
      prisma as any,
      supabase as any,
      {} as any,
      validation as any,
      {} as any,
      {} as any,
      {} as any,
    );

    beforeEach(() => {
      jest.clearAllMocks();
      prisma.db.user.findUnique.mockResolvedValue(user);
      prisma.db.logs.create.mockResolvedValue(undefined);
      supabase.client.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });
    });

    it('normalizes a mixed-case email before looking up the user and requesting a reset link', async () => {
      const response = await service.forgotPassword(
        { email: submittedEmail },
        '127.0.0.1',
        'Jest',
        'https://app.gurokonekt.ph',
      );

      expect(validation.normalizeEmail).toHaveBeenCalledWith(submittedEmail);
      expect(prisma.db.user.findUnique).toHaveBeenCalledWith({
        where: { email: storedEmail },
      });
      expect(supabase.client.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        storedEmail,
        {
          redirectTo: 'https://app.gurokonekt.ph/reset-password',
        },
      );
      expect(prisma.db.logs.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: { email: storedEmail } }),
        }),
      );
      expect(response.statusCode).toBe(200);
    });
  });

  describe('resendEmailSignUpConfirmation', () => {
    const user = { id: 'user-id', email: 'mentor@example.com' };
    const prisma = {
      db: {
        user: { findUnique: jest.fn() },
        logs: { create: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
      },
    };
    const supabase = {
      client: {
        auth: { resend: jest.fn() },
      },
      clientAdmin: {
        auth: {
          admin: {
            getUserById: jest.fn(),
            updateUserById: jest.fn(),
          },
        },
      },
    };
    const validation = {
      normalizeEmail: jest.fn((email: string) => email.toLowerCase().trim()),
    };

    const service = new AuthService(
      prisma as any,
      supabase as any,
      {} as any,
      validation as any,
      {} as any,
      {} as any,
      {} as any,
    );

    beforeEach(() => {
      jest.clearAllMocks();
      prisma.db.user.findUnique.mockResolvedValue(user);
      prisma.db.logs.create.mockResolvedValue(undefined);
      prisma.db.logs.findFirst.mockResolvedValue(null);
      supabase.client.auth.resend.mockResolvedValue({ data: true, error: null });
      supabase.clientAdmin.auth.admin.updateUserById.mockResolvedValue({
        error: null,
      });
    });

    const confirmedAuthUser = {
      data: { user: { email_confirmed_at: '2026-08-18T04:21:14.000Z' } },
      error: null,
    };

    it('QA: expired resend still sends when Auth is confirmed but the mentor never signed in', async () => {
      supabase.clientAdmin.auth.admin.getUserById.mockResolvedValue(confirmedAuthUser);

      const response = await service.resendEmailSignUpConfirmation(
        { type: 'signup', email: 'Mentor@Example.com' } as any,
        '127.0.0.1',
        'Jest',
      );

      expect(prisma.db.logs.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actionType: 'signin',
            createdById: user.id,
            metadata: { path: ['outcome'], equals: 'success' },
          }),
        }),
      );
      expect(supabase.clientAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
        user.id,
        { email_confirm: false },
      );
      expect(supabase.client.auth.resend).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'mentor@example.com',
        }),
      );
      const unconfirmOrder =
        supabase.clientAdmin.auth.admin.updateUserById.mock.invocationCallOrder[0];
      const resendOrder = supabase.client.auth.resend.mock.invocationCallOrder[0];
      expect(unconfirmOrder).toBeLessThan(resendOrder);
      expect(response.status).toBe(ResponseStatus.Success);
      expect(response.statusCode).toBe(
        API_RESPONSE.SUCCESS.CONFIRMATION_EMAIL_SENT.code,
      );
      expect(response.message).not.toMatch(/already confirmed/i);
    });

    it('does not treat admin approval as email verification when looking up sign-in', async () => {
      supabase.clientAdmin.auth.admin.getUserById.mockResolvedValue(confirmedAuthUser);

      await service.resendEmailSignUpConfirmation(
        { type: 'signup', email: user.email } as any,
        '127.0.0.1',
        'Jest',
      );

      const where = prisma.db.logs.findFirst.mock.calls[0][0].where;
      expect(where.actionType).toBe('signin');
      expect(where.actionType).not.toBe('admin_approve_mentor');
    });

    it('resends without unconfirming when Auth still has no confirmation timestamp', async () => {
      supabase.clientAdmin.auth.admin.getUserById.mockResolvedValue({
        data: { user: { email_confirmed_at: null } },
        error: null,
      });

      const response = await service.resendEmailSignUpConfirmation(
        { type: 'signup', email: user.email } as any,
        '127.0.0.1',
        'Jest',
      );

      expect(supabase.clientAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
      expect(supabase.client.auth.resend).toHaveBeenCalled();
      expect(response.statusCode).toBe(
        API_RESPONSE.SUCCESS.CONFIRMATION_EMAIL_SENT.code,
      );
    });

    it('keeps already-confirmed when the user has successfully signed in', async () => {
      supabase.clientAdmin.auth.admin.getUserById.mockResolvedValue(confirmedAuthUser);
      prisma.db.logs.findFirst.mockResolvedValue({ id: 'sign-in-log' });

      const response = await service.resendEmailSignUpConfirmation(
        { type: 'signup', email: 'mentor@example.com' } as any,
        '127.0.0.1',
        'Jest',
      );

      expect(supabase.clientAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
      expect(supabase.client.auth.resend).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(
        API_RESPONSE.ERROR.EMAIL_ALREADY_CONFIRMED.code,
      );
    });
  });
});


describe('AuthService.signInWithGoogle', () => {
  const session = { access_token: 'access-token', refresh_token: 'refresh-token' };
  const googleAuthUser = {
    id: 'user-1',
    email: 'jane@example.com',
    identities: [{ provider: 'google' }],
  };
  const mentee = {
    id: 'user-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Dela Cruz',
    role: 'mentee',
    status: 'active',
    isProfileComplete: true,
    isMentorProfileComplete: false,
  };

  const prisma = {
    db: {
      user: { findUnique: jest.fn(), update: jest.fn() },
      menteeProfile: { findUnique: jest.fn() },
    },
  };
  const supabase = {
    client: { auth: { signInWithIdToken: jest.fn() } },
    clientAdmin: { auth: { admin: { deleteUser: jest.fn() } } },
    unlinkIdentityWithSession: jest.fn(),
  };
  const logging = { log: jest.fn() };
  const errorHandler = { handleUnexpectedError: jest.fn() };

  const service = new AuthService(
    prisma as any,
    supabase as any,
    {} as any,
    {} as any,
    logging as any,
    {} as any,
    errorHandler as any,
  );

  const signIn = () =>
    service.signInWithGoogle({ idToken: 'google-id-token', nonce: 'raw-nonce' }, '127.0.0.1', 'Jest');

  beforeEach(() => {
    jest.clearAllMocks();
    supabase.client.auth.signInWithIdToken.mockResolvedValue({
      data: { user: googleAuthUser, session },
      error: null,
    });
    supabase.clientAdmin.auth.admin.deleteUser.mockResolvedValue({ error: null });
    prisma.db.user.findUnique.mockResolvedValue(mentee);
    prisma.db.menteeProfile.findUnique.mockResolvedValue({ id: 'profile-1' });
  });

  it('signs in an existing mentee and returns the same shape as password sign-in', async () => {
    const response = await signIn();

    expect(supabase.client.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'google-id-token',
      nonce: 'raw-nonce',
    });
    expect(response.status).toBe(ResponseStatus.Success);
    expect(response.statusCode).toBe(API_RESPONSE.SUCCESS.SIGN_WITH_GOOGLE.code);
    expect(response.data).toEqual({ user: mentee, session, redirectUrl: null });
    expect(logging.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: LogsActionType.SignInGoogle,
        metadata: { email: 'jane@example.com', outcome: 'success' },
      }),
    );
  });

  it('rejects an invalid Google token without logging the token', async () => {
    supabase.client.auth.signInWithIdToken.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Bad ID token', code: 'bad_jwt' },
    });

    const response = await signIn();

    expect(response.statusCode).toBe(API_RESPONSE.ERROR.SIGNIN_GOOGLE_FAILED.code);
    expect(prisma.db.user.findUnique).not.toHaveBeenCalled();
    expect(JSON.stringify(logging.log.mock.calls)).not.toContain('google-id-token');
  });

  it('rejects an unknown Google account and removes the auth user Supabase just created', async () => {
    prisma.db.user.findUnique.mockResolvedValue(null);

    const response = await signIn();

    expect(response.statusCode).toBe(API_RESPONSE.ERROR.SIGNIN_GOOGLE_ACCOUNT_NOT_FOUND.code);
    expect(response.data).toBeNull();
    expect(supabase.clientAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('never deletes an auth user that also has an email/password identity', async () => {
    prisma.db.user.findUnique.mockResolvedValue(null);
    supabase.client.auth.signInWithIdToken.mockResolvedValue({
      data: {
        user: { ...googleAuthUser, identities: [{ provider: 'email' }, { provider: 'google' }] },
        session,
      },
      error: null,
    });

    const response = await signIn();

    expect(response.statusCode).toBe(API_RESPONSE.ERROR.SIGNIN_GOOGLE_ACCOUNT_NOT_FOUND.code);
    expect(supabase.clientAdmin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('undoes a Google link Supabase just made to an existing password account and asks to connect from Settings', async () => {
    const justNow = new Date().toISOString();
    const googleIdentity = { provider: 'google', created_at: justNow };
    supabase.client.auth.signInWithIdToken.mockResolvedValue({
      data: { user: { ...googleAuthUser, identities: [{ provider: 'email', created_at: '2026-01-01T00:00:00Z' }, googleIdentity] }, session },
      error: null,
    });
    supabase.unlinkIdentityWithSession.mockResolvedValue(session);

    const response = await signIn();

    expect(supabase.unlinkIdentityWithSession).toHaveBeenCalledWith(session, googleIdentity);
    expect(response.statusCode).toBe(API_RESPONSE.ERROR.GOOGLE_NOT_CONNECTED.code);
    expect(response.data).toBeNull();
  });

  it('signs in right after Google was connected in Settings, even though the link is brand new', async () => {
    const justNow = new Date().toISOString();
    supabase.client.auth.signInWithIdToken.mockResolvedValue({
      data: {
        user: {
          ...googleAuthUser,
          identities: [
            { provider: 'email', created_at: '2026-01-01T00:00:00Z' },
            { provider: 'google', identity_id: 'google-identity-1', created_at: justNow },
          ],
        },
        session,
      },
      error: null,
    });
    prisma.db.user.findUnique
      .mockResolvedValueOnce(mentee)
      .mockResolvedValueOnce({ googleIdentityId: 'google-identity-1' });

    const response = await signIn();

    expect(response.status).toBe(ResponseStatus.Success);
    expect(supabase.unlinkIdentityWithSession).not.toHaveBeenCalled();
  });

  it('signs in when Google was connected to the password account earlier', async () => {
    supabase.client.auth.signInWithIdToken.mockResolvedValue({
      data: {
        user: {
          ...googleAuthUser,
          identities: [
            { provider: 'email', created_at: '2026-01-01T00:00:00Z' },
            { provider: 'google', created_at: '2026-09-01T00:00:00Z' },
          ],
        },
        session,
      },
      error: null,
    });

    const response = await signIn();

    expect(response.status).toBe(ResponseStatus.Success);
    expect(supabase.unlinkIdentityWithSession).not.toHaveBeenCalled();
  });

  it.each([
    ['admin', 'active', 'SIGNIN_GOOGLE_NOT_AVAILABLE'],
    ['mentee', 'banned', 'SIGNIN_ACCOUNT_BLOCKED'],
    ['mentor', 'suspended', 'SIGNIN_ACCOUNT_BLOCKED'],
    ['mentor', 'pending_review', 'SIGNIN_MENTOR_PENDING_REVIEW'],
    ['mentor', 'rejected', 'SIGNIN_MENTOR_REJECTED'],
  ] as const)('blocks a %s with status %s (%s) and returns no session', async (role, status, errorKey) => {
    prisma.db.user.findUnique.mockResolvedValue({ ...mentee, role, status });

    const response = await signIn();

    expect(response.status).toBe(ResponseStatus.Error);
    expect(response.statusCode).toBe(API_RESPONSE.ERROR[errorKey].code);
    expect(response.message).toBe(API_RESPONSE.ERROR[errorKey].message);
    expect(response.data).toBeNull();
  });

  it('lets an inactive user sign in so they can reactivate their account', async () => {
    prisma.db.user.findUnique.mockResolvedValue({ ...mentee, status: 'inactive' });

    const response = await signIn();

    expect(response.status).toBe(ResponseStatus.Success);
  });

  it('corrects a mentee marked complete who has no profile row', async () => {
    prisma.db.menteeProfile.findUnique.mockResolvedValue(null);

    const response = await signIn();

    expect(prisma.db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isProfileComplete: false },
    });
    expect((response.data as { user: { isProfileComplete: boolean } }).user.isProfileComplete).toBe(false);
  });

  it('never logs Google attempts as password sign-ins, so the password lockout is unaffected', async () => {
    await signIn();
    prisma.db.user.findUnique.mockResolvedValue(null);
    await signIn();

    for (const [entry] of logging.log.mock.calls) {
      expect(entry.actionType).toBe(LogsActionType.SignInGoogle);
    }
  });
});

describe('findNewGoogleLink', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  const at = (secondsAgo: number) => new Date(now.getTime() - secondsAgo * 1000).toISOString();

  it.each([
    ['a Google identity created just now on a password account', [{ provider: 'email', created_at: at(9999) }, { provider: 'google', created_at: at(5) }], true],
    ['a Google identity connected earlier', [{ provider: 'email', created_at: at(9999) }, { provider: 'google', created_at: at(600) }], false],
    ['an account created with Google only', [{ provider: 'google', created_at: at(5) }], false],
    ['an account without Google', [{ provider: 'email', created_at: at(5) }], false],
  ])('%s -> %s', (_case, identities, expected) => {
    expect(!!findNewGoogleLink({ identities } as any, now)).toBe(expected);
  });
});
