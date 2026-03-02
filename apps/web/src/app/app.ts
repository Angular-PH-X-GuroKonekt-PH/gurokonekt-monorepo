import { Component, signal, inject, effect } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { ToastContainerComponent } from './components/shared/toast/toast.component';

@Component({
  imports: [RouterModule, ToastContainerComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  
  protected title = 'GuroKonekt';
  protected readonly showSidebar = signal(false);
  protected readonly menteeName = 'John Doe';
  
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects)
    )
  );

  constructor() {
    effect(() => {
      const url = this.navigationEnd();
      if (url) {
        const showSidebarRoutes = ['/dashboard', '/profile', '/settings', '/mentoring'];
        const shouldShow = showSidebarRoutes.some(route => url.startsWith(route));
        this.showSidebar.set(shouldShow);
      }
    });
  }
}
