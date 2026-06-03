import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from './sidebar.types';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { IconName } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly navItems = input<NavItem[]>([]);
  readonly bottomNavItems = input<NavItem[]>([]);

  asIconName(icon: string): IconName {
    return icon as IconName;
  }
}
