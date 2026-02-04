import { Component, inject } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CURRENT_MENTEE_NAME } from 'lib/models/src/lib/dashboard.data';
import { Sidebar } from './components/sidebar/sidebar';
import { signal } from '@angular/core';
import { filter } from 'rxjs/operators';

@Component({
  imports: [RouterModule, Sidebar, CommonModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'GuroKonekt';
  protected readonly menteeName = CURRENT_MENTEE_NAME;
  private router = inject(Router);
  protected showSidebar = signal(false);

  constructor() {
    // Set initial visibility based on current URL to avoid first-load flash
    const initialUrl = this.router.url ?? '/';
    this.showSidebar.set(!this.shouldHideForUrl(initialUrl));

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url: string = event.url ?? '/';
        this.showSidebar.set(!this.shouldHideForUrl(url));
      });
  }

  private shouldHideForUrl(url: string): boolean {
    // Hide sidebar for onboarding flows (default for root and onboarding pages)
    if (url === '/' || url === '') return true;
    
    return (
      url.includes('choose-role') ||
      url.includes('register') ||
      url.includes('login') ||
      url.includes('verify-email')
    );
  }
}
