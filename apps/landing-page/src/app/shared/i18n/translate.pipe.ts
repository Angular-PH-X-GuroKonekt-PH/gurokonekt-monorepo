import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';
import { TranslationKey } from './translations';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(key: TranslationKey): string {
    return this.translation.translate(key);
  }
}