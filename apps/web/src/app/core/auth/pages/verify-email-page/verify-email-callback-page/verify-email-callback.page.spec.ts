import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APP_ROUTES } from '../../../../../shared/constants/routes';
import * as emailVerificationUtil from '../../../../../shared/utils/email-verification.util';
import { AuthStorageService } from '../../../../storage/auth-storage.service';
import { AuthSelectors } from '../../../store/auth.selectors';
import { InitializeVerification } from '../../../store/verify-email.actions';
import { VerifyEmailCallbackPage } from './verify-email-callback.page';

describe('VerifyEmailCallbackPage', () => {
  let router: { navigate: ReturnType<typeof vi.fn> };
  let store: {
    selectSnapshot: ReturnType<typeof vi.fn>;
    dispatch: ReturnType<typeof vi.fn>;
  };
  let authStorage: {
    getLastRegisteredEmail: ReturnType<typeof vi.fn>;
    setLastRegisteredEmail: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    router = { navigate: vi.fn().mockResolvedValue(true) };
    store = {
      selectSnapshot: vi.fn().mockReturnValue(null),
      dispatch: vi.fn(),
    };
    authStorage = {
      getLastRegisteredEmail: vi.fn().mockReturnValue(null),
      setLastRegisteredEmail: vi.fn(),
    };

    vi.spyOn(
      emailVerificationUtil,
      'hasPasswordRecoveryCallbackHash'
    ).mockReturnValue(false);
    vi.spyOn(
      emailVerificationUtil,
      'getEmailVerificationParams'
    ).mockReturnValue(
      new URLSearchParams(
        'error=access_denied&error_code=otp_expired&error_description=expired'
      )
    );
    vi.spyOn(
      emailVerificationUtil,
      'resolveEmailVerificationOutcome'
    ).mockReturnValue('expired');
    vi.spyOn(
      emailVerificationUtil,
      'getVerificationEmailFromCallback'
    ).mockReturnValue('');

    TestBed.configureTestingModule({
      imports: [VerifyEmailCallbackPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: Store, useValue: store },
        { provide: AuthStorageService, useValue: authStorage },
      ],
    });
  });

  it('navigates to expired with email query when callback carries an email', () => {
    vi.spyOn(
      emailVerificationUtil,
      'getVerificationEmailFromCallback'
    ).mockReturnValue('mentor@example.com');

    TestBed.createComponent(VerifyEmailCallbackPage).detectChanges();

    expect(store.dispatch).toHaveBeenCalledWith(
      new InitializeVerification({
        email: 'mentor@example.com',
        role: '',
        message: '',
      })
    );
    expect(router.navigate).toHaveBeenCalledWith(
      [APP_ROUTES.VERIFY_EMAIL_EXPIRED],
      {
        replaceUrl: true,
        queryParams: { email: 'mentor@example.com' },
      }
    );
  });

  it('never attaches an empty email query param when all sources are blank', () => {
    store.selectSnapshot.mockImplementation((selector) => {
      if (selector === AuthSelectors.lastRegisteredEmail) {
        return '   ';
      }
      return null;
    });
    authStorage.getLastRegisteredEmail.mockReturnValue('');

    TestBed.createComponent(VerifyEmailCallbackPage).detectChanges();

    expect(store.dispatch).not.toHaveBeenCalledWith(
      expect.any(InitializeVerification)
    );
    expect(router.navigate).toHaveBeenCalledWith(
      [APP_ROUTES.VERIFY_EMAIL_EXPIRED],
      {
        replaceUrl: true,
        queryParams: undefined,
      }
    );
  });

  it('uses localStorage email when query email is missing', () => {
    authStorage.getLastRegisteredEmail.mockReturnValue('stored@example.com');

    TestBed.createComponent(VerifyEmailCallbackPage).detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(
      [APP_ROUTES.VERIFY_EMAIL_EXPIRED],
      {
        replaceUrl: true,
        queryParams: { email: 'stored@example.com' },
      }
    );
  });
});
