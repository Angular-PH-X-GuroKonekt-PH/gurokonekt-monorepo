import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IconComponent } from '../../../../../../shared/components/icon/icon.component';
import {
  AvatarCropModalComponent,
  type AvatarCropResult,
} from '../../../../../../shared/components/avatar-crop-modal/avatar-crop-modal.component';
import { resolveAvatarFileSelection } from '../../../../../../shared/utils/avatar-validation.util';

@Component({
  selector: 'app-profile-edit-avatar',
  standalone: true,
  imports: [IconComponent, AvatarCropModalComponent],
  templateUrl: './profile-edit-avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProfileEditAvatarComponent {
  readonly avatarPreview = input<string | null>(null);
  readonly currentAvatarUrl = input<string | null>(null);
  readonly avatarError = input<string | null>(null);

  /** Emitted after the user crops and applies a valid image. */
  readonly avatarReady = output<AvatarCropResult>();
  readonly removePreview = output<HTMLInputElement>();
  readonly removeCurrent = output<HTMLInputElement>();
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

  private closeCropModal(): void {
    this.isCropOpen.set(false);
    this.cropSourceFile.set(null);
  }
}
