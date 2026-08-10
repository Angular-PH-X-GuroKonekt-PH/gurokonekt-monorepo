import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { Store } from '@ngxs/store';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AuthStorageService } from '../../../../storage/auth-storage.service';
import { AuthSelectors } from '../../../store/auth.selectors';
import {
  InitializeVerification,
  ResendVerificationEmail,
} from '../../../store/verify-email.actions';
import { VerifyEmailState } from '../../../store/verify-email.state';
import { VerifyEmailExpiredPage } from './verify-email-expired.page';

describe('VerifyEmailExpiredPage', () => {
  const emailSignal = signal('');
  const messageSignal = signal('');
  const resendErrorSignal = signal<string | null>(null);
  const loadingSignal = signal(false);

  let fixture: ComponentFixture<VerifyEmailExpiredPage>;
  let store: {
    selectSignal: ReturnType<typeof vi.fn>;
    selectSnapshot: ReturnType<typeof vi.fn>;
    dispatch: ReturnType<typeof vi.fn>;
  };
  let authStorage: {
    getLastRegisteredEmail: ReturnType<typeof vi.fn>;
    setLastRegisteredEmail: ReturnType<typeof vi.fn>;
  };
  let queryParams: Record<string, string | null>;

  const createComponent = () => {
    TestBed.configureTestingModule({
      imports: [VerifyEmailExpiredPage],
      providers: [
        provideRouter([]),
        { provide: Store, useValue: store },
        { provide: AuthStorageService, useValue: authStorage },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(VerifyEmailExpiredPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(() => {
    emailSignal.set('');
    messageSignal.set('');
    resendErrorSignal.set(null);
    loadingSignal.set(false);
    queryParams = {};

    store = {
      selectSignal: vi.fn((selector) => {
        if (selector === VerifyEmailState.email) return emailSignal;
        if (selector === VerifyEmailState.message) return messageSignal;
        if (selector === VerifyEmailState.resendError) return resendErrorSignal;
        if (selector === VerifyEmailState.isResendLoading) return loadingSignal;
        return signal(null);
      }),
      selectSnapshot: vi.fn(),
      dispatch: vi.fn(),
    };

    authStorage = {
      getLastRegisteredEmail: vi.fn().mockReturnValue(null),
      setLastRegisteredEmail: vi.fn(),
    };

    store.selectSnapshot.mockImplementation((selector) => {
      if (selector === AuthSelectors.lastRegisteredEmail) {
        return null;
      }
      return null;
    });
  });

  it('hydrates email from the route query and never initializes with empty email', () => {
    queryParams = { email: ' Mentor@Example.com ' };

    createComponent();

    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ email: 'mentor@example.com' }),
      })
    );
    expect(authStorage.setLastRegisteredEmail).toHaveBeenCalledWith(
      'mentor@example.com'
    );

    const initCalls = store.dispatch.mock.calls.filter(
      ([action]) => action instanceof InitializeVerification
    );
    for (const [action] of initCalls) {
      expect((action as InitializeVerification).payload.email.trim()).not.toBe(
        ''
      );
    }
  });

  it('falls back to localStorage when query and store email are empty', () => {
    authStorage.getLastRegisteredEmail.mockReturnValue('stored@example.com');

    createComponent();

    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ email: 'stored@example.com' }),
      })
    );
  });

  it('does not dispatch InitializeVerification when every email source is empty', () => {
    createComponent();

    const initCalls = store.dispatch.mock.calls.filter(
      ([action]) => action instanceof InitializeVerification
    );
    expect(initCalls).toHaveLength(0);
  });

  it('requires a typed email before resend when no known email exists', () => {
    const component = createComponent() as unknown as {
      needsEmailInput: () => boolean;
      canResend: () => boolean;
      onEmailInput: (event: Event) => void;
      resendVerification: () => void;
    };

    expect(component.needsEmailInput()).toBe(true);
    expect(component.canResend()).toBe(false);

    component.resendVerification();
    expect(store.dispatch).not.toHaveBeenCalledWith(
      expect.any(ResendVerificationEmail)
    );

    component.onEmailInput({
      target: { value: 'typed@example.com' },
    } as unknown as Event);

    expect(component.canResend()).toBe(true);
    component.resendVerification();

    expect(store.dispatch).toHaveBeenCalledWith(
      new ResendVerificationEmail('typed@example.com')
    );
  });

  it('ignores whitespace-only query email and still requires input', () => {
    queryParams = { email: '   ' };

    const component = createComponent() as unknown as {
      needsEmailInput: () => boolean;
      canResend: () => boolean;
    };

    expect(store.dispatch).not.toHaveBeenCalledWith(
      expect.any(InitializeVerification)
    );
    expect(component.needsEmailInput()).toBe(true);
    expect(component.canResend()).toBe(false);
  });
});
