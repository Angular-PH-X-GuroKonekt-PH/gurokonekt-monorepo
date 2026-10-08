import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Replaces the password step when registering with Google: Google secures the account. */
@Component({
  selector: 'app-registration-google-secured-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900">Account Security</h2>
        <p class="text-gray-600 mt-2">Your account is secured with Google</p>
      </div>

      <div class="rounded-2xl border-2 border-blue-100 bg-blue-50/50 p-6 text-center">
        <p class="text-gray-700">
          You'll sign in with your Google account
          <span class="block mt-1 font-semibold text-gray-900 break-all">{{ email() }}</span>
        </p>
        <p class="mt-4 text-sm text-gray-600">
          No password needed. If you ever want one, use "Forgot password?" on the login page.
        </p>
      </div>
    </div>
  `,
})
export class GoogleSecuredStepComponent {
  readonly email = input.required<string>();
}
