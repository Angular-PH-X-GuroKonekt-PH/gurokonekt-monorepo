import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import {
  AvatarCropModalComponent,
  type AvatarCropResult,
} from '../../avatar-crop-modal/avatar-crop-modal.component';
import { resolveAvatarFileSelection } from '../../../utils/avatar-validation.util';

@Component({
  selector: 'app-profile-setup-avatar',
  standalone: true,
  imports: [IconComponent, AvatarCropModalComponent],
  templateUrl: './profile-setup-avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProfileSetupAvatarComponent {
  readonly previewUrl = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly buttonLabel = input('Choose Profile Picture');
  readonly helperText = input('JPG, JPEG or PNG. Max 5MB. Required.');

  /** Emitted after the user crops and applies a valid image. */
  readonly avatarReady = output<AvatarCropResult>();
  readonly removed = output<HTMLInputElement>();
  readonly selectionFailed = output<string | null>();

  protected readonly isCropOpen = signal(false);
  protected readonly cropSourceFile = signal<File | null>(null);

  protected onFileInputChange(event: Event): void {
    const selection = resolveAvatarFileSelection(event);
    if (selection.status === 'empty') {
      return;
    }
    if (selection.status === 'invalid') {
      this.selectionFailed.emit(selection.error);
      return;
    }

    this.selectionFailed.emit(null);
    this.cropSourceFile.set(selection.file);
    this.isCropOpen.set(true);
  }

  protected onCropped(result: AvatarCropResult): void {
    this.avatarReady.emit(result);
    this.closeCropModal();
  }

  protected onCropCancelled(): void {
    this.closeCropModal();
  }

  protected onRemove(input: HTMLInputElement): void {
    this.removed.emit(input);
  }

  private closeCropModal(): void {
    this.isCropOpen.set(false);
    this.cropSourceFile.set(null);
  }
}
