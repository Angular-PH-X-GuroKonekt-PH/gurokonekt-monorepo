import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  ImageCroppedEvent,
  ImageCropperComponent,
} from 'ngx-image-cropper';
import { IconComponent } from '../icon/icon.component';

export interface AvatarCropResult {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-avatar-crop-modal',
  standalone: true,
  imports: [ImageCropperComponent, IconComponent],
  templateUrl: './avatar-crop-modal.component.html',
  host: {
    class:
      'fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4',
    role: 'presentation',
  },
})
export class AvatarCropModalComponent implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly imageChangedEvent = input<Event | null>(null);
  readonly imageFile = input<File | null>(null);
  readonly originalFileName = input('avatar.png');

  readonly cropped = output<AvatarCropResult>();
  readonly cancelled = output<void>();

  private readonly latestCrop = signal<ImageCroppedEvent | null>(null);
  protected readonly isApplying = signal(false);
  protected readonly cropError = signal<string | null>(null);

  ngOnInit(): void {
    // Attach to body so viewport-fixed overlay is not trapped by parent
    // transform/filter/backdrop-filter (e.g. settings content panel).
    document.body.appendChild(this.host.nativeElement);
    document.body.classList.add('overflow-hidden');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('overflow-hidden');
    this.host.nativeElement.remove();
  }

  protected onImageCropped(event: ImageCroppedEvent): void {
    this.latestCrop.set(event);
    this.cropError.set(null);
  }

  protected onLoadFailed(): void {
    this.cropError.set('Failed to load image. Please try another file.');
  }

  protected async applyCrop(): Promise<void> {
    const crop = this.latestCrop();
    if (!crop?.blob) {
      this.cropError.set('Adjust the crop area, then apply again.');
      return;
    }

    this.isApplying.set(true);
    this.cropError.set(null);

    try {
      const fileName = this.buildCroppedFileName();
      const file = new File([crop.blob], fileName, {
        type: crop.blob.type || 'image/png',
      });
      const previewUrl =
        crop.objectUrl || crop.base64 || URL.createObjectURL(crop.blob);

      this.cropped.emit({ file, previewUrl });
    } catch {
      this.cropError.set('Could not crop this image. Please try again.');
    } finally {
      this.isApplying.set(false);
    }
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  private buildCroppedFileName(): string {
    const original = this.originalFileName() || 'avatar.png';
    const base = original.replace(/\.[^.]+$/, '') || 'avatar';
    return `${base}-cropped.png`;
  }
}
