import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { APP_ROUTES } from '../../../../shared/constants/routes';
import { IconComponent, type IconName } from '../../../../shared/components/icon/icon.component';

interface SettingsNavItem {
  route: string;
  label: string;
  description: string;
  icon: IconName;
}

@Component({
  selector: 'app-profile-settings-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  templateUrl: './profile-settings.page.html',
  host: { class: 'block' },
})
export class ProfileSettingsPage {
  protected readonly dashboardRoute = `/${APP_ROUTES.DASHBOARD}`;

  protected readonly sections: SettingsNavItem[] = [
    {
      route: `/${APP_ROUTES.SETTINGS_OVERVIEW}`,
      label: 'Overview',
      description: 'Account identity',
      icon: 'user',
    },
    {
      route: `/${APP_ROUTES.SETTINGS_EDIT}`,
      label: 'Edit Profile',
      description: 'Details & picture',
      icon: 'pencil-square',
    },
  ];
}
