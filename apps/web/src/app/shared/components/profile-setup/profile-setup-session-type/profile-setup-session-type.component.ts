import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MenteePreferredSessionType } from '@gurokonekt/models/interfaces/user/user.model';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-profile-setup-session-type',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './profile-setup-session-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProfileSetupSessionTypeComponent {
  readonly selectedCount = input.required<number>();
  readonly isSelected =
    input.required<(type: MenteePreferredSessionType) => boolean>();

  readonly toggled = output<MenteePreferredSessionType>();

  protected readonly sessionTypes = MenteePreferredSessionType;
}
