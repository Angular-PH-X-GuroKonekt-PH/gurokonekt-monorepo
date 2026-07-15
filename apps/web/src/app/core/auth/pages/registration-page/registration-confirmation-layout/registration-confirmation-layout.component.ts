import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { RegistrationShellComponent } from '../registration-shell/registration-shell.component';

@Component({
  selector: 'app-registration-confirmation-layout',
  standalone: true,
  imports: [IconComponent, RegistrationShellComponent],
  templateUrl: './registration-confirmation-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationConfirmationLayoutComponent {
  welcomeMessage = input.required<string>();
  nextSteps = input.required<string[]>();
  lastRegisteredEmail = input<string | null>(null);
  loginClicked = output<void>();
}
