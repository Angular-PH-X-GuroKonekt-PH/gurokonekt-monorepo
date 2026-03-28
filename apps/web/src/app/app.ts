import {
  Component,
  signal,
  inject,
  effect,
  afterNextRender,
} from '@angular/core';
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
      filter((event) => event instanceof NavigationEnd),
      map((event) => (event as NavigationEnd).urlAfterRedirects)
    )
  );

  constructor() {
    afterNextRender(() => {
      import('flowbite').then(({ initFlowbite }) => initFlowbite());
    });

    effect(() => {
      const url = this.navigationEnd();
      if (!url) return;

      this.initFlowbiteComponents();
      this.closeMobileDrawer();
    });
  }

  private initFlowbiteComponents(): void {
    import('flowbite').then(({ initFlowbite }) => initFlowbite());
  }

  private closeMobileDrawer(): void {
    const drawer = document.getElementById('top-bar-sidebar');
    const backdrop = document.querySelector('[drawer-backdrop]');

    if (drawer) {
      drawer.classList.add('-translate-x-full');
      drawer.setAttribute('aria-hidden', 'true');
    }

    if (backdrop) {
      backdrop.remove();
    }

    document.body.classList.remove('overflow-hidden');
  }
}
