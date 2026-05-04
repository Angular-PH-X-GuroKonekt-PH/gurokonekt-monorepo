import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngxs/store';

import * as AuthActions from '../../../../store/auth/auth.actions';
import { IconComponent } from "../../icon/icon.component";

@Component({
  selector: 'app-mentee-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './mentee-sidebar.html',
  styleUrl: './mentee-sidebar.scss',
})
export class MenteeSidebar {
  private readonly store = inject(Store);

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }
}
