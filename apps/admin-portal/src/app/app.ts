import { Component, inject, effect, afterNextRender } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { filter, map } from 'rxjs/operators';
import * as AuthActions from './core/auth/store/auth.actions';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected title = 'GuroKonekt Admin';

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => (event as NavigationEnd).urlAfterRedirects)
    )
  );

  constructor() {
    this.store.dispatch(new AuthActions.RestoreSession());

    afterNextRender(() => {
      import('flowbite').then(({ initFlowbite }) => initFlowbite());
    });

    effect(() => {
      const url = this.navigationEnd();
      if (!url) return;
      import('flowbite').then(({ initFlowbite }) => initFlowbite());
    });
  }
}
