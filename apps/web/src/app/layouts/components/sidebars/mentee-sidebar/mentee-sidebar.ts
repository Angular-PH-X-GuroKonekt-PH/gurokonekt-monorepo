import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngxs/store';

import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-mentee-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './mentee-sidebar.html',
})
export class MenteeSidebar {
  private readonly store = inject(Store);

  protected logout(): void {
    void this.store.dispatch(new AuthActions.Logout());
  }
}
