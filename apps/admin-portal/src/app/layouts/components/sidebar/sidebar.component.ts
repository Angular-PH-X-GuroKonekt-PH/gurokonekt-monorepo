import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngxs/store';
import { NavItem } from './sidebar.types';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { IconName } from '../../../shared/components/icon/icon.component';
import * as AuthActions from '../../../core/auth/store/auth.actions';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly store = inject(Store);

  readonly navItems = input<NavItem[]>([]);
  readonly bottomNavItems = input<NavItem[]>([]);

  asIconName(icon: string): IconName {
    return icon as IconName;
  }

  protected logout(): void {
    this.store.dispatch(new AuthActions.Logout());
  }
}
