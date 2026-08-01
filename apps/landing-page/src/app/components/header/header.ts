import { Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { TranslationService } from '../../shared/i18n/translation.service';


@Component({
  selector: 'app-header',
  imports: [TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly appConfig = inject(APP_CONFIG);
  readonly translation = inject(TranslationService);

  readonly signInUrl = this.appConfig.SIGN_IN_URL;
  readonly registerUrl = this.appConfig.REGISTER_URL;
}
