import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-registration-shell',
  standalone: true,
  templateUrl: './registration-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationShellComponent {
  /** Optional page heading shown under the brand logo. */
  readonly title = input<string>();
  readonly subtitle = input<string>();
}
