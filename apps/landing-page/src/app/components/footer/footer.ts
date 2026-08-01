import { Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  private readonly appConfig = inject(APP_CONFIG);

  readonly joinUrl = this.appConfig.SIGN_IN_URL;
  readonly communityUrl = 'https://angular-ph.org';
  readonly facebookUrl = 'https://www.facebook.com/profile.php?id=61592939991798';
  readonly linkedInUrl = 'https://www.linkedin.com/company/gurokonekt/';
}
