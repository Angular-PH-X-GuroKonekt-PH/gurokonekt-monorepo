import { Test } from '@nestjs/testing';
import { API_RESPONSE, ResponseStatus } from '@gurokonekt/models';

import { AuthService } from './auth.service';
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

