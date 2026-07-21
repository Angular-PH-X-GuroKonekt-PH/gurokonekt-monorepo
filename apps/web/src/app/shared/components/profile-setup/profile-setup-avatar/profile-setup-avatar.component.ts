import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-profile-setup-avatar',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './profile-setup-avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProfileSetupAvatarComponent {
  readonly previewUrl = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly buttonLabel = input('Choose Profile Picture');
  readonly helperText = input('JPG, JPEG or PNG. Max 5MB. Required.');

  readonly fileSelected = output<Event>();
  readonly removed = output<HTMLInputElement>();
}
