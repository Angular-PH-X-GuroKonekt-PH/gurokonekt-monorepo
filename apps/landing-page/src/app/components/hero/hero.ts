import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-hero',
  imports: [ScrollRevealDirective, TranslatePipe, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  private readonly appConfig = inject(APP_CONFIG);

  readonly signInUrl = this.appConfig.SIGN_IN_URL;
}
