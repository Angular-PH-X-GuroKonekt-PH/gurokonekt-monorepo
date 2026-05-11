import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../shared/components/toast/toast.component';
import { NavbarComponent } from './components/navbar/navbar/navbar.component';
import { SidebarComponent } from './components/sidebars/sidebar/sidebar.component';
import { NavItem } from './components/sidebars/sidebar/sidebar.types';
import { APP_ROUTES } from '../shared/constants/routes';
import { AuthState } from '../core/auth/store/auth.state';
import { createSelectMap } from '@ngxs/store'
import { AuthSelectors } from '../core/auth/store/auth.selectors';

@Component({
  selector: 'app-layout',
  imports: [ToastContainerComponent, RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './layout.html',
})
export class Layout {
  protected readonly menteeItems: NavItem[] = [
    { label: 'Dashboard',    route: APP_ROUTES.DASHBOARD,        icon: 'chart-bar' },
    { label: 'Find Mentors', route: APP_ROUTES.FIND_MENTORS,     icon: 'users' },
    { label: 'Bookings',      route: APP_ROUTES.BOOKING_OVERVIEW, icon: 'book-open' },
  ];

  protected readonly mentorItems: NavItem[] = [
    { label: 'Dashboard', route: APP_ROUTES.DASHBOARD, icon: 'squares-2x2' },
    { label: 'Bookings',   route: APP_ROUTES.BOOKING_OVERVIEW,   icon: 'book-open' },
    { label: 'Availability',  route: APP_ROUTES.MANAGE_AVAILABILITY,  icon: 'calendar-days' },
  ];

  protected readonly bottomNavItems: NavItem[] = [
    { label: 'Profile Settings', route: APP_ROUTES.SETTINGS, icon: 'cog-6-tooth' },
  ];

  protected readonly selectorSignal = createSelectMap({
    user: AuthSelectors.user,
  })

  public topNavItems = computed(() => {
    const user = this.selectorSignal.user();
    if (!user) {
      return [];
    }
    return user.role === 'mentee' ? this.menteeItems : this.mentorItems;
  });
}
