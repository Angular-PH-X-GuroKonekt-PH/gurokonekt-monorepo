import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-profile-setup-shell',
  standalone: true,
  templateUrl: './profile-setup-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSetupShellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
}
