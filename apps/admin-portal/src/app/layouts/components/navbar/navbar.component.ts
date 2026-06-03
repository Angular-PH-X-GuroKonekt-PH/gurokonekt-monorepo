import { Component, inject } from '@angular/core';
import { Store, createSelectMap } from '@ngxs/store';
import { AuthSelectors } from '../../../core/auth/store/auth.selectors';
import * as AuthActions from '../../../core/auth/store/auth.actions';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-navbar',
  imports: [IconComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private readonly store = inject(Store);

  protected readonly selectors = createSelectMap({
    user: AuthSelectors.user,
  });

  protected logout(): void {
    this.store.dispatch(new AuthActions.Logout());
  }
}
