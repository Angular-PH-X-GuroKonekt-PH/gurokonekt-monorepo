import { Component, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { IconComponent } from "../icon/icon.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink, IconComponent, CommonModule],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss',
})
export class Breadcrumbs {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly currentPageTitle$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      let currentRoute = this.activatedRoute.root;

      while (currentRoute.firstChild) {
        currentRoute = currentRoute.firstChild;
      }

      return currentRoute.snapshot.title || 'Page';
    })
  );
}
