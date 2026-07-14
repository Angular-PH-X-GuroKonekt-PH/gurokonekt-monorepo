import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { map } from 'rxjs';

import { RegistrationConfirmationLayoutComponent } from '../registration-confirmation-layout/registration-confirmation-layout.component';
import { APP_ROUTES } from '../../../../../shared/constants/routes';
import { AuthSelectors } from '../../../store/auth.selectors';

type ConfirmationRole = 'mentee' | 'mentor';

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

  protected readonly content = computed(
    () => CONFIRMATION_CONTENT[this.role()]
  );

  protected navigateToLogin(): void {
    this.router.navigate([APP_ROUTES.LOGIN]);
  }
}
