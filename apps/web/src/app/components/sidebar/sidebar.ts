import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly isCollapsed = signal(false);

  readonly mainNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Mentorship', route: '/mentorship', icon: '🤝' },
    { label: 'Sessions', route: '/sessions', icon: '📅' },
    { label: 'Growth', route: '/growth', icon: '📈' },
    { label: 'Messages', route: '/messages', icon: '💬' },
    { label: 'Resources', route: '/resources', icon: '📚' },
    { label: 'Notifications', route: '/notifications', icon: '🔔' },
  ];

  readonly bottomNavItems: NavItem[] = [
    { label: 'Profile', route: '/profile', icon: '👤' },
    { label: 'Settings', route: '/settings', icon: '⚙️' },
  ];

  toggleSidebar(): void {
    this.isCollapsed.update(value => !value);
  }
}
