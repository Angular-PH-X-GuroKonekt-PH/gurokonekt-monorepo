import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ForgotPasswordPage } from './forgot-password.page';
import { PasswordResetService } from '../../services/password-reset.service';

const EMAIL = 'admin@gurokonekt.com';

const mockService = { requestReset: vi.fn() };

describe('ForgotPasswordPage', () => {
  let page: ForgotPasswordPage;

  const submitWith = async (email: string) => {
    page.email = email;
    page.onSubmit();
    await Promise.resolve();
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockService.requestReset.mockReturnValue(of('Reset link sent'));

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [
        { provide: PasswordResetService, useValue: mockService },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    page = TestBed.createComponent(ForgotPasswordPage).componentInstance;
  });

  it('starts by asking for an email', () => {
    expect(page.isSent).toBe(false);
  });

  it('does not submit an empty email', () => {
    page.onSubmit();

    expect(mockService.requestReset).not.toHaveBeenCalled();
  });

  it('sends the reset request and confirms it was sent', async () => {
    await submitWith(EMAIL);

    expect(mockService.requestReset).toHaveBeenCalledWith(EMAIL);
    expect(page.isSent).toBe(true);
    expect(page.errorMessage).toBe('');
  });

  it('trims surrounding whitespace from the email', async () => {
    await submitWith(`  ${EMAIL}  `);

    expect(mockService.requestReset).toHaveBeenCalledWith(EMAIL);
  });

  it('shows the server error and stays on the form', async () => {
    mockService.requestReset.mockReturnValue(throwError(() => ({ message: 'User not found' })));

    await submitWith(EMAIL);

    expect(page.isSent).toBe(false);
    expect(page.errorMessage).toBe('User not found');
    expect(page.isLoading).toBe(false);
  });
});
