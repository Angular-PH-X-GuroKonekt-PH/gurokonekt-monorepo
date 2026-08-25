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
});
