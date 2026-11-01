import { effect, inject, Signal } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';

import { GoogleRegistrationContext } from '../models/registration.state.model';
import { RegistrationSelectors } from '../store/registration.selectors';

/**
 * Puts a registration form in Google mode while a Google sign-up is in
 * progress: the Google name fills empty name fields, the email is locked to
 * the verified Google address, and the password fields are switched off
 * (Google secures the account). Everything else the form requires is still
 * collected as usual. Leaving Google mode unlocks the form again.
 *
 * Call from a constructor, after the form is built.
 */
export function useGoogleRegistration(form: FormGroup): Signal<GoogleRegistrationContext | null> {
  const googleRegistration = inject(Store).selectSignal(RegistrationSelectors.googleRegistration);
  const passwordControls = ['password', 'confirmPassword'].map((name) => form.get(name));
  let googleEmail: string | null = null;

  effect(() => {
    const context = googleRegistration();
    const email = form.get('email');

    if (context) {
      const { firstName, lastName } = form.getRawValue();
      form.patchValue({
        email: context.prefill.email,
        // Cleared so a half-typed password can't trip the "passwords match" check.
        password: '',
        confirmPassword: '',
        ...(firstName ? {} : { firstName: context.prefill.firstName }),
        ...(lastName ? {} : { lastName: context.prefill.lastName }),
      });
      googleEmail = context.prefill.email;
      email?.disable();
      passwordControls.forEach((control) => control?.disable());
      return;
    }

    email?.enable();
    passwordControls.forEach((control) => control?.enable());
    if (googleEmail && email?.value === googleEmail) {
      email.reset('');
    }
    googleEmail = null;
  });

  return googleRegistration;
}

/**
 * Step check for a field Google mode may lock. Angular never reports a
 * disabled control as `valid`, but a locked field holds the verified Google
 * value, so it counts as filled in.
 */
export function isValidOrLocked(control: AbstractControl | null): boolean {
  return !!control && (control.valid || control.disabled);
}
