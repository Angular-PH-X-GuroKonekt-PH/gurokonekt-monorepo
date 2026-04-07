import { Component, signal, inject, effect, afterNextRender } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { ToastContainerComponent } from './components/shared/toast/toast.component';
import { Sidebar } from './components/sidebar/sidebar';
import { SIDEBAR_PREFIX_ROUTES } from './constants/routes';

@Component({
  imports: [RouterModule, ToastContainerComponent, Sidebar],
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
    afterNextRender(() => {
      import('flowbite').then(({ initFlowbite }) => initFlowbite());
    });

    effect(() => {
      const url = this.navigationEnd();
      if (url) {
        const shouldShow = SIDEBAR_PREFIX_ROUTES.some(route => url.startsWith(route));
        this.showSidebar.set(shouldShow);
      }
    });
  }
}
