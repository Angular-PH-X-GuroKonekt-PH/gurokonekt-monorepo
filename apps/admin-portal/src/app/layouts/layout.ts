import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NavItem } from './components/sidebar/sidebar.types';
import { APP_ROUTES } from '../shared/constants/routes';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './layout.html',
})
export class Layout {
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard',          route: APP_ROUTES.DASHBOARD,          icon: 'squares-2x2' },
    { label: 'Mentee Management',  route: APP_ROUTES.MENTEE_MANAGEMENT,  icon: 'users' },
    { label: 'Mentor Management',  route: APP_ROUTES.MENTOR_MANAGEMENT,  icon: 'academic-cap' },
    { label: 'Booking Management', route: APP_ROUTES.BOOKING_MANAGEMENT, icon: 'calendar-days' },
  ];
}
