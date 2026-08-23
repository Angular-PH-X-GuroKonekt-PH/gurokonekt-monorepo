import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../services/auth.service';
import { ForgetPasswordPage } from './forget-password-page';

describe('ForgetPasswordPage', () => {
  let component: ForgetPasswordPage;
  let fixture: ComponentFixture<ForgetPasswordPage>;
  let authService: { forgotPassword: ReturnType<typeof vi.fn> };
  let toastService: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authService = { forgotPassword: vi.fn() };
    toastService = { success: vi.fn(), error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ForgetPasswordPage],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgetPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a success message after a reset link is requested', async () => {
    authService.forgotPassword.mockReturnValue(
      of({ message: 'Password reset link sent to your email' }),
    );
    component.loginForm.setValue({ email: 'mentor@example.com' });

    await component['onSubmit']();

    expect(authService.forgotPassword).toHaveBeenCalledWith(
      'mentor@example.com',
    );
    expect(toastService.success).toHaveBeenCalledWith(
      'Password reset link sent to your email',
      'Check your email',
    );
    expect(component.loginForm.getRawValue()).toEqual({ email: '' });
  });

  it('shows the API error when the reset request fails', async () => {
    authService.forgotPassword.mockReturnValue(
      throwError(() => ({ message: 'User not found.' })),
    );
    component.loginForm.setValue({ email: 'mentor@example.com' });

    await component['onSubmit']();

    expect(toastService.error).toHaveBeenCalledWith(
      'User not found.',
      'Unable to send reset link',
    );
    expect(toastService.success).not.toHaveBeenCalled();
    expect(component.loginForm.getRawValue()).toEqual({
      email: 'mentor@example.com',
    });
  });
});
