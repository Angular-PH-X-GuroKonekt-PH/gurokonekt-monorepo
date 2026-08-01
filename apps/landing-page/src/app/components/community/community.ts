import { Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-community',
  imports: [ScrollRevealDirective, TranslatePipe],
  templateUrl: './community.html',
  styleUrl: './community.scss',
})
export class Community {
  private readonly appConfig = inject(APP_CONFIG);

  readonly signInUrl = this.appConfig.SIGN_IN_URL;
}
