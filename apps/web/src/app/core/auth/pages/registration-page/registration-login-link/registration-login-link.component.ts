import {
  ChangeDetectionStrategy,
  Component,
  output,
} from '@angular/core';

@Component({
  selector: 'app-registration-login-link',
  standalone: true,
  templateUrl: './registration-login-link.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationLoginLinkComponent {
  readonly loginClicked = output<void>();
}
