import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { createFormConfig } from '../constants/form-validation-configs.constants';
import { getIanaTimezoneOptions } from '../utils/location-data.util';
import { BaseRegistrationComponent } from './base-registration.component';

class SignupForm extends BaseRegistrationComponent {
  readonly registerForm;

  constructor(role: 'MENTEE_REGISTER' | 'MENTOR_REGISTER') {
    super();
    const config = createFormConfig(role);
    this.registerForm = this.fb.group(config.fields, config.options);
    this.setupFormAutoPopulation();
  }
}

describe('signup timezone selection', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => vi.restoreAllMocks());

  it.each(['MENTEE_REGISTER', 'MENTOR_REGISTER'] as const)(
    'defaults %s to the browser timezone and preserves manual selections',
    (role) => {
      const original = Intl.DateTimeFormat.prototype.resolvedOptions;
      vi.spyOn(
        Intl.DateTimeFormat.prototype,
        'resolvedOptions',
      ).mockImplementation(function () {
        return { ...original.call(this), timeZone: 'Asia/Singapore' };
      });
      const signup = TestBed.runInInjectionContext(() => new SignupForm(role));
      TestBed.tick();

      expect(signup.registerForm.get('timezone')?.value).toBe('Asia/Singapore');
      expect(
        getIanaTimezoneOptions().some(
          (option) => option.value === 'Asia/Singapore',
        ),
      ).toBe(true);

      signup.registerForm.patchValue({ timezone: 'Asia/Tokyo', country: 'US' });
      TestBed.tick();
      expect(signup.registerForm.get('timezone')?.value).toBe('Asia/Tokyo');
    },
  );

  it('requires a manual choice when browser timezone detection fails', () => {
    vi.spyOn(
      Intl.DateTimeFormat.prototype,
      'resolvedOptions',
    ).mockImplementation(() => {
      throw new Error('Timezone unavailable');
    });
    const signup = TestBed.runInInjectionContext(
      () => new SignupForm('MENTEE_REGISTER'),
    );

    expect(signup.registerForm.get('timezone')?.value).toBe('');
    expect(signup.registerForm.get('timezone')?.hasError('required')).toBe(
      true,
    );
    expect(getIanaTimezoneOptions().length).toBeGreaterThan(0);
  });
});
