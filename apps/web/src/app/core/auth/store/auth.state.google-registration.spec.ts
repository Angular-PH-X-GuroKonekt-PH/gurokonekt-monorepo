import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store, provideStore } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { AuthState } from './auth.state';
import { AuthSelectors } from './auth.selectors';
import { LoginWithGoogle, RegisterMenteeWithGoogle, RegisterMentorWithGoogle } from './auth.actions';
import { RegistrationState } from './registration.state';
import { RegistrationSelectors } from './registration.selectors';
import { StartGoogleRegistration } from './registration.actions';
import { AuthStorageService } from '../../storage/auth-storage.service';
import { ToastService } from '../../../shared/services/toast.service';
import { GoogleRegistrationContext } from '../models/registration.state.model';

const GOOGLE_CONTEXT: GoogleRegistrationContext = {
  registrationToken: 'registration-token',
  refreshToken: 'refresh-1',
  prefill: { email: 'jane@example.com', firstName: 'Jane', lastName: 'Dela Cruz', avatarUrl: null },
};

const FORM_FIELDS = {
  firstName: 'Jane',
  lastName: 'Dela Cruz',
  phoneNumber: '+639171234567',
  country: 'PH',
  timezone: 'Asia/Manila',
  language: 'en',
};

describe('AuthState / Google registration', () => {
  let store: Store;
  let httpMock: HttpTestingController;
  let storage: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    sessionStorage.clear();
    storage = {
      getToken: vi.fn().mockReturnValue(null),
      getRefreshToken: vi.fn().mockReturnValue(null),
      getUser: vi.fn().mockReturnValue(null),
      setUser: vi.fn(),
      setToken: vi.fn(),
      setRefreshToken: vi.fn(),
      clear: vi.fn(),
      setLastRegisteredEmail: vi.fn(),
    };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore([AuthState, RegistrationState]),
        { provide: AuthStorageService, useValue: storage },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ToastService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });

    store = TestBed.inject(Store);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('sends a new Google account to registration instead of signing it in', async () => {
    const done = firstValueFrom(store.dispatch(new LoginWithGoogle({ idToken: 'google-id-token' })));

    httpMock.expectOne((req) => req.url.endsWith('/auth/signin/google')).flush({
      statusCode: 200,
      message: 'Finish creating your GuroKonekt account to continue.',
      data: {
        registrationRequired: true,
        registration: { registrationToken: 'registration-token', refreshToken: 'refresh-1' },
        prefill: GOOGLE_CONTEXT.prefill,
      },
    });
    await done;

    expect(store.selectSnapshot(RegistrationSelectors.googleRegistration)).toEqual(GOOGLE_CONTEXT);
    expect(store.selectSnapshot(AuthSelectors.user)).toBeNull();
    expect(store.selectSnapshot(AuthSelectors.isLoginLoading)).toBe(false);
    expect(storage.setToken).not.toHaveBeenCalled();
    // Survives a refresh of the registration form.
    expect(JSON.parse(sessionStorage.getItem('google_registration') ?? 'null')).toEqual(GOOGLE_CONTEXT);
  });

  it('signs the new mentee in after Google registration, ready for profile setup', async () => {
    store.dispatch(new StartGoogleRegistration(GOOGLE_CONTEXT));
    const done = firstValueFrom(
      store.dispatch(new RegisterMenteeWithGoogle({ ...FORM_FIELDS, registrationToken: 'registration-token', refreshToken: 'refresh-1' }))
    );

    const request = httpMock.expectOne((req) => req.url.endsWith('/auth/register-mentee/google'));
    expect(request.request.body).toEqual(expect.objectContaining({ registrationToken: 'registration-token', firstName: 'Jane' }));
    expect(request.request.body).not.toHaveProperty('email');
    expect(request.request.body).not.toHaveProperty('password');
    request.flush({
      statusCode: 201,
      message: 'Mentee registered successfully',
      data: {
        user: { id: 'u1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Dela Cruz', role: 'mentee', status: 'active', isProfileComplete: false },
        session: { access_token: 'access-token', refresh_token: 'refresh-token' },
      },
    });
    await done;

    expect(store.selectSnapshot(AuthSelectors.user)).toEqual(
      expect.objectContaining({ id: 'u1', role: 'mentee', isProfileComplete: false })
    );
    expect(storage.setToken).toHaveBeenCalledWith('access-token');
    expect(store.selectSnapshot(AuthSelectors.successMessage)).toContain('account is ready');
    expect(store.selectSnapshot(RegistrationSelectors.googleRegistration)).toBeNull();
    expect(sessionStorage.getItem('google_registration')).toBeNull();
  });

  it('submits the mentor application as multipart with documents, then shows the confirmation', async () => {
    store.dispatch(new StartGoogleRegistration(GOOGLE_CONTEXT));
    const document = new File(['pdf'], 'id.pdf', { type: 'application/pdf' });
    const done = firstValueFrom(
      store.dispatch(
        new RegisterMentorWithGoogle(
          {
            ...FORM_FIELDS,
            registrationToken: 'registration-token',
            yearsOfExperience: 5,
            areasOfExpertise: ['Angular'],
            files: [document],
          },
          'jane@example.com'
        )
      )
    );

    const request = httpMock.expectOne((req) => req.url.endsWith('/auth/register-mentor/google'));
    const body = request.request.body as FormData;
    expect(body.get('registrationToken')).toBe('registration-token');
    expect(body.get('areasOfExpertise')).toBe('["Angular"]');
    expect(body.get('files')).toBeInstanceOf(File);
    expect(body.has('email')).toBe(false);
    request.flush({ statusCode: 201, message: 'Mentor registered successfully', data: {} });
    await done;

    expect(storage.setLastRegisteredEmail).toHaveBeenCalledWith('jane@example.com');
    expect(store.selectSnapshot(AuthSelectors.user)).toBeNull();
    expect(store.selectSnapshot(RegistrationSelectors.googleRegistration)).toBeNull();
  });

  it('drops an expired Google sign-up so the person can continue with Google again', async () => {
    store.dispatch(new StartGoogleRegistration(GOOGLE_CONTEXT));
    const message = 'Your Google sign-up has expired. Please continue with Google again.';
    const done = firstValueFrom(
      store.dispatch(new RegisterMenteeWithGoogle({ ...FORM_FIELDS, registrationToken: 'expired' }))
    );

    httpMock
      .expectOne((req) => req.url.endsWith('/auth/register-mentee/google'))
      .flush({ statusCode: 401, message }, { status: 401, statusText: 'Unauthorized' });
    await expect(done).rejects.toBeDefined();

    expect(store.selectSnapshot(AuthSelectors.errorMessage)).toBe(message);
    expect(store.selectSnapshot(RegistrationSelectors.googleRegistration)).toBeNull();
  });

  it('points an existing account to Google login instead of creating a duplicate', async () => {
    store.dispatch(new StartGoogleRegistration(GOOGLE_CONTEXT));
    const done = firstValueFrom(
      store.dispatch(new RegisterMenteeWithGoogle({ ...FORM_FIELDS, registrationToken: 'registration-token' }))
    );

    httpMock
      .expectOne((req) => req.url.endsWith('/auth/register-mentee/google'))
      .flush({ statusCode: 409, message: 'User already exists' }, { status: 409, statusText: 'Conflict' });
    await expect(done).rejects.toBeDefined();

    expect(store.selectSnapshot(AuthSelectors.errorMessage)).toBe(
      'You already have a GuroKonekt account. Please log in with Google instead.'
    );
    // Not an expiry, so the Google sign-up is kept.
    expect(store.selectSnapshot(RegistrationSelectors.googleRegistration)).toEqual(GOOGLE_CONTEXT);
  });
});
