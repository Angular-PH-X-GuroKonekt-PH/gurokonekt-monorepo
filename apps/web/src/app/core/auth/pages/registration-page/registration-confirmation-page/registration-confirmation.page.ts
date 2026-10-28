import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { map } from 'rxjs';

import { RegistrationConfirmationLayoutComponent } from '../registration-confirmation-layout/registration-confirmation-layout.component';
import { APP_ROUTES } from '../../../../../shared/constants/routes';
import { AuthSelectors } from '../../../store/auth.selectors';

type ConfirmationRole = 'mentee' | 'mentor';

// Google registrations skip email verification and sign in with Google.
const GOOGLE_MENTOR_CONTENT = {
  welcomeMessage:
    'We are glad you are joining us as a mentor. Your application has been received and our team will review your profile soon.',
  nextSteps: [
    'Our team reviews your profile and documents.',
    'You will receive an email when your account is approved.',
    'Then sign in with the same Google account using "Continue with Google".',
  ],
};

const CONFIRMATION_CONTENT: Record<
  ConfirmationRole,
  { welcomeMessage: string; nextSteps: string[] }
> = {
  mentee: {
    welcomeMessage:
      'We are glad you are joining us as a mentee. Your registration has been received and you are almost ready to start learning!',
    nextSteps: [
      'Verify your email so you can sign in.',
      'Complete your profile to personalize your experience.',
      'Browse available mentors and book your first session.',
    ],
  },
  mentor: {
    welcomeMessage:
      'We are glad you are joining us as a mentor. Your application has been received and our team will review your profile soon.',
    nextSteps: [
      'Verify your email so you can sign in.',
      'Our team reviews your profile and documents.',
      'You will receive an email when your account is approved.',
    ],
  },
};

@Component({
  selector: 'app-registration-confirmation-page',
  standalone: true,
  imports: [RegistrationConfirmationLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-registration-confirmation-layout
      [welcomeMessage]="content().welcomeMessage"
      [nextSteps]="content().nextSteps"
      [lastRegisteredEmail]="lastRegisteredEmail()"
      [showEmailVerification]="!viaGoogle()"
      (loginClicked)="navigateToLogin()"
    />
  `,
})
export class RegistrationConfirmationPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);

  protected readonly lastRegisteredEmail = this.store.selectSignal(
    AuthSelectors.lastRegisteredEmail
  );

  private readonly role = toSignal(
    this.route.data.pipe(
      map((data) => (data['role'] as ConfirmationRole) ?? 'mentee')
    ),
    { initialValue: 'mentee' as ConfirmationRole }
  );

  protected readonly viaGoogle = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('via') === 'google')),
    { initialValue: false }
  );

  protected readonly content = computed(() =>
    this.viaGoogle() && this.role() === 'mentor' ? GOOGLE_MENTOR_CONTENT : CONFIRMATION_CONTENT[this.role()]
  );

  protected navigateToLogin(): void {
    this.router.navigate([APP_ROUTES.LOGIN]);
  }
}
