import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { APP_ROUTES } from '../../../../../shared/constants/routes';
import { AuthSelectors } from '../../../store/auth.selectors';

@Component({
  selector: 'app-registration-mentor-confirmation-page',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './registration-mentor-confirmation.page.html',
})
export class RegistrationMentorConfirmationPage {
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly lastRegisteredEmail = this.store.selectSignal(
    AuthSelectors.lastRegisteredEmail
  );

  protected navigateToLogin(): void {
    this.router.navigate([APP_ROUTES.LOGIN]);
  }
}
