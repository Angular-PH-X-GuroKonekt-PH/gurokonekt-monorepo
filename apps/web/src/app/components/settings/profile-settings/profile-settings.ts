import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { APP_ROUTES } from '../../../constants/routes';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettings {
  readonly overviewRoute = APP_ROUTES.SETTINGS_OVERVIEW;
}
