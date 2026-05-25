import { Component, input, output } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-registration-confirmation-layout',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './registration-confirmation-layout.component.html',
})
export class RegistrationConfirmationLayoutComponent {
  welcomeMessage = input.required<string>();
  nextSteps = input.required<string[]>();
  lastRegisteredEmail = input<string | null>(null);
  loginClicked = output<void>();
}
