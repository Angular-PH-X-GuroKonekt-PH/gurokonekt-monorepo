import { Component, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store, createSelectMap } from '@ngxs/store';
import { AuthSelectors } from '../../store/auth.selectors';
import * as AuthActions from '../../store/auth.actions';
import { APP_ROUTES } from '../../../../shared/constants/routes';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly selectors = createSelectMap({
    isLoginLoading: AuthSelectors.isLoginLoading,
    errorMessage: AuthSelectors.errorMessage,
    isAuthenticated: AuthSelectors.isAuthenticated,
  });

  protected email = '';
  protected password = '';

  constructor() {
    effect(() => {
      if (this.selectors.isAuthenticated()) {
        this.router.navigate([APP_ROUTES.DASHBOARD]);
      }
    });
  }

  protected onSubmit(): void {
    if (!this.email || !this.password) return;
    this.store.dispatch(new AuthActions.Login({ email: this.email, password: this.password }));
  }
}
