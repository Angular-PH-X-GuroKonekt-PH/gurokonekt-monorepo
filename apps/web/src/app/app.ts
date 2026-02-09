import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  
  protected title = 'GuroKonekt';
  protected readonly showSidebar = signal(false);
  protected readonly menteeName = 'John Doe';
  
  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const showSidebarRoutes = ['/dashboard', '/profile', '/settings', '/mentoring'];
      const shouldShow = showSidebarRoutes.some(route => event.urlAfterRedirects.startsWith(route));
      this.showSidebar.set(shouldShow);
    });
  }
}
