import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../../shared/components/toast/toast.component';
import { SidebarComponent } from '../components/sidebars/sidebar/sidebar.component';
import { NavItem } from '../components/sidebars/sidebar/sidebar.types';
import { MentorNavbar } from '../components/navbar/mentor-navbar/mentor-navbar.component';

@Component({
  selector: 'app-mentor-layout',
  imports: [MentorNavbar, RouterOutlet, ToastContainerComponent, SidebarComponent],
  templateUrl: './mentor.layout.html',
})
export class MentorLayout {
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard',    route: '/dashboard',    icon: 'chart-bar' },
    { label: 'My Bookings',  route: '/my-booking',   icon: 'calendar-days' },
    { label: 'Availability', route: '/availability', icon: 'check-mark-circle' },
  ];
}
