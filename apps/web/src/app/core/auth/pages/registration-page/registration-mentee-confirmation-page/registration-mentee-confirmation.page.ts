import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { RegistrationConfirmationLayoutComponent } from '../registration-confirmation-layout/registration-confirmation-layout.component';
import { APP_ROUTES } from '../../../../../shared/constants/routes';
import { AuthSelectors } from '../../../store/auth.selectors';

@Component({
  selector: 'app-registration-mentee-confirmation-page',
  standalone: true,
  imports: [RegistrationConfirmationLayoutComponent],
  template: `
    <app-registration-confirmation-layout
      [welcomeMessage]="welcomeMessage"
      [nextSteps]="nextSteps"
      [lastRegisteredEmail]="lastRegisteredEmail()"
      (loginClicked)="navigateToLogin()"
    />
  `,
})
export class RegistrationMenteeConfirmationPage {
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly lastRegisteredEmail = this.store.selectSignal(
    AuthSelectors.lastRegisteredEmail
  );

  protected readonly welcomeMessage =
    'We are glad you are joining us as a mentee. Your registration has been received and you are almost ready to start learning!';

  protected readonly nextSteps = [
    'Verify your email so you can sign in.',
    'Complete your profile to personalize your experience.',
    'Browse available mentors and book your first session.',
  ];

  protected navigateToLogin(): void {
    this.router.navigate([APP_ROUTES.LOGIN]);
  }
}
