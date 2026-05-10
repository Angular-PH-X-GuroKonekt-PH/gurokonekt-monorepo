import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from '../../shared/components/toast/toast.component';
import { MenteeNavbar } from '../components/navbar/mentee-navbar/mentee-navbar.component';
import { SidebarComponent } from '../components/sidebars/sidebar/sidebar.component';
import { NavItem } from '../components/sidebars/sidebar/sidebar.types';

@Component({
  selector: 'app-mentee-layout',
  imports: [ToastContainerComponent, RouterOutlet, MenteeNavbar, SidebarComponent],
  templateUrl: './mentee.layout.html',
  styleUrl: './mentee.layout.scss',
})
export class MenteeLayout {
  protected readonly topNavItems: NavItem[] = [
    { label: 'Dashboard',    route: '/dashboard',        icon: 'chart-bar' },
    { label: 'Find Mentors', route: '/find-mentors',     icon: 'users' },
    { label: 'Booking',      route: '/booking-overview', icon: 'book-open' },
  ];

  protected readonly bottomNavItems: NavItem[] = [
    { label: 'Profile Settings', route: '/settings', icon: 'cog-6-tooth' },
  ];
}
