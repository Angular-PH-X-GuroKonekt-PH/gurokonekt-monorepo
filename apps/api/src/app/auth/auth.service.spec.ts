import { AuthService } from './auth.service';

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
