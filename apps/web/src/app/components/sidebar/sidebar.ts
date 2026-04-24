import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { APP_ROUTES } from '../../constants/routes';
import { IconComponent, IconName } from '../shared/icon/icon.component';

interface NavItem {
  label: string;
  route: string;
  icon: IconName;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly isCollapsed = signal(false);

  readonly mainNavItems: NavItem[] = [
    { label: 'Mentorship', route: '/mentorship', icon: 'users' },
    { label: 'Sessions', route: '/sessions', icon: 'calendar-days' },
    { label: 'Growth', route: '/growth', icon: 'chart-bar' },
    { label: 'Messages', route: '/messages', icon: 'chat-bubble-left-right' },
    { label: 'Resources', route: '/resources', icon: 'book-open' },
    { label: 'Notifications', route: '/notifications', icon: 'bell' },
  ];

  readonly bottomNavItems: NavItem[] = [
    { label: 'Profile Settings', route: APP_ROUTES.SETTINGS, icon: 'cog-6-tooth' },
  ];

  toggleSidebar(): void {
    this.isCollapsed.update(value => !value);
  }
}
