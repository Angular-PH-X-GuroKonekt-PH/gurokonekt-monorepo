import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store, provideStore } from '@ngxs/store';

import { isValidOrLocked, useGoogleRegistration } from './google-registration.helper';
import { RegistrationState } from '../store/registration.state';
import { ClearGoogleRegistration, StartGoogleRegistration } from '../store/registration.actions';

const GOOGLE_CONTEXT = {
  registrationToken: 'registration-token',
  prefill: { email: 'jane@example.com', firstName: 'Jane', lastName: 'Dela Cruz', avatarUrl: null },
};

describe('useGoogleRegistration', () => {
  let store: Store;
  let form: FormGroup;

  const stepOneIsValid = () =>
    !!form.get('firstName')?.valid && !!form.get('lastName')?.valid && isValidOrLocked(form.get('email'));

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideStore([RegistrationState])] });
    store = TestBed.inject(Store);
    form = new FormGroup({
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
    });
    TestBed.runInInjectionContext(() => useGoogleRegistration(form));
    TestBed.tick();
  });

  it('fills in the Google details, locks the email and turns off the password fields', () => {
    store.dispatch(new StartGoogleRegistration(GOOGLE_CONTEXT));
    TestBed.tick();

    expect(form.getRawValue()).toEqual(
      expect.objectContaining({ firstName: 'Jane', lastName: 'Dela Cruz', email: 'jane@example.com' })
    );
    expect(form.get('email')?.disabled).toBe(true);
    expect(form.get('password')?.disabled).toBe(true);
    expect(form.valid).toBe(true);
  });

  it('lets the first step continue with the locked Google email', () => {
    store.dispatch(new StartGoogleRegistration(GOOGLE_CONTEXT));
    TestBed.tick();

    // A disabled control is never `valid` in Angular; the step check must still pass.
    expect(form.get('email')?.valid).toBe(false);
    expect(stepOneIsValid()).toBe(true);
  });

  it('keeps names the person already typed', () => {
    form.patchValue({ firstName: 'Janey' });
    store.dispatch(new StartGoogleRegistration(GOOGLE_CONTEXT));
    TestBed.tick();

    expect(form.get('firstName')?.value).toBe('Janey');
  });

  it('unlocks the form and clears the Google email when switching back to email and password', () => {
    store.dispatch(new StartGoogleRegistration(GOOGLE_CONTEXT));
    TestBed.tick();
    store.dispatch(new ClearGoogleRegistration());
    TestBed.tick();

    expect(form.get('email')?.enabled).toBe(true);
    expect(form.get('email')?.value).toBe('');
    expect(form.get('password')?.enabled).toBe(true);
    expect(stepOneIsValid()).toBe(false);
  });
});

describe('isValidOrLocked', () => {
  it('accepts a valid or locked field and rejects an invalid one', () => {
    const invalid = new FormControl('', Validators.required);
    const locked = new FormControl({ value: 'jane@example.com', disabled: true });

    expect(isValidOrLocked(new FormControl('x', Validators.required))).toBe(true);
    expect(isValidOrLocked(locked)).toBe(true);
    expect(isValidOrLocked(invalid)).toBe(false);
    expect(isValidOrLocked(null)).toBe(false);
  });
});
