import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngxs/store';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { NavItem } from './sidebar.types';

@Component({
  selector: 'gk-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  private readonly store = inject(Store);

  topNavItems = input<NavItem[]>([]);
  bottomNavItems = input<NavItem[]>([]);
  showLogout = input<boolean>(false);

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }
}
