import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { APP_ROUTES } from '../../../../../shared/constants/routes';
import { EmailVerificationResultLayoutComponent } from '../email-verification-result-layout/email-verification-result-layout.component';

@Component({
  selector: 'app-verify-email-already-verified-page',
  standalone: true,
  imports: [EmailVerificationResultLayoutComponent, IconComponent],
  templateUrl: './verify-email-already-verified.page.html',
})
export class VerifyEmailAlreadyVerifiedPage {
  private readonly router = inject(Router);

  protected navigateToLogin(): void {
    void this.router.navigate([APP_ROUTES.LOGIN]);
  }
}
