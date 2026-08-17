import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ResetPasswordPage } from './reset-password.page';
import { PasswordResetService } from '../../services/password-reset.service';
import { APP_ROUTES } from '../../../../shared/constants/routes';

const PASSWORD = 'NewPassw0rd!';
const ACCESS_TOKEN = 'recovery-access-token';

const mockService = { completeReset: vi.fn() };
const mockRouter = { navigate: vi.fn() };

/** Put a Supabase recovery callback in the address bar before the page loads. */
const setLocationHash = (hash: string) => {
  window.history.replaceState({}, '', `/reset-password${hash}`);
};

describe('ResetPasswordPage', () => {
  const build = async (): Promise<ResetPasswordPage> => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        { provide: PasswordResetService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    return TestBed.createComponent(ResetPasswordPage).componentInstance;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockService.completeReset.mockReturnValue(of('Password updated'));
    setLocationHash(`#access_token=${ACCESS_TOKEN}&type=recovery`);
  });

  describe('capturing the recovery link', () => {
    it('accepts a valid recovery callback', async () => {
      const page = await build();

      expect(page.linkError).toBe('');
    });

    it('strips the token from the address bar once captured', async () => {
      await build();

      expect(window.location.hash).toBe('');
    });

    it('rejects a callback with no access token', async () => {
      setLocationHash('#type=recovery');

      const page = await build();

      expect(page.linkError).toBe('This password reset link is invalid or has expired.');
    });

    it('rejects a callback that is not a recovery link', async () => {
      setLocationHash(`#access_token=${ACCESS_TOKEN}&type=signup`);

      const page = await build();

      expect(page.linkError).toBe('This password reset link is invalid or has expired.');
    });

    it('surfaces the error description Supabase sent back', async () => {
      setLocationHash('#error_description=Email+link+is+invalid+or+has+expired');

      const page = await build();

      expect(page.linkError).toBe('Email link is invalid or has expired');
    });
  });

  describe('submitting a new password', () => {
    let page: ResetPasswordPage;

    beforeEach(async () => {
      page = await build();
      page.newPassword = PASSWORD;
      page.confirmPassword = PASSWORD;
    });

    it('rejects mismatched passwords without calling the server', () => {
      page.confirmPassword = 'something-else';

      page.onSubmit();

      expect(mockService.completeReset).not.toHaveBeenCalled();
      expect(page.errorMessage).toBe('Passwords do not match.');
    });

    it('sends the captured token with the new password and returns to login', async () => {
      page.onSubmit();
      await Promise.resolve();

      expect(mockService.completeReset).toHaveBeenCalledWith({
        accessToken: ACCESS_TOKEN,
        newPassword: PASSWORD,
      });
      expect(mockRouter.navigate).toHaveBeenCalledWith([APP_ROUTES.LOGIN]);
    });

    it('shows the server error and stays put when the link has expired', async () => {
      mockService.completeReset.mockReturnValue(
        throwError(() => ({ message: 'Reset link expired' }))
      );

      page.onSubmit();
      await Promise.resolve();

      expect(page.errorMessage).toBe('Reset link expired');
      expect(page.isLoading).toBe(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  it('refuses to submit when no valid token was captured', async () => {
    setLocationHash('#type=recovery');
    const page = await build();
    page.newPassword = PASSWORD;
    page.confirmPassword = PASSWORD;

    page.onSubmit();

    expect(mockService.completeReset).not.toHaveBeenCalled();
  });
});
