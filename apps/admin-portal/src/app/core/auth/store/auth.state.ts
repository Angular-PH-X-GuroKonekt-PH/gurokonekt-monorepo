import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { State, Action, StateContext } from '@ngxs/store';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { AuthStorageService } from '../../storage/auth-storage.service';
import { AuthStateModel, initialAuthState } from '../models/auth.state.model';
import { APP_ROUTES } from '../../../shared/constants/routes';
import * as AuthActions from './auth.actions';

@State<AuthStateModel>({
  name: 'adminAuth',
  defaults: initialAuthState,
})
@Injectable()
export class AuthState {
  private readonly authService = inject(AuthService);
  private readonly storage = inject(AuthStorageService);
  private readonly router = inject(Router);

  @Action(AuthActions.Login)
  login(ctx: StateContext<AuthStateModel>, action: AuthActions.Login) {
    ctx.patchState({ isLoginLoading: true, isLoading: true, errorMessage: null, successMessage: null });

    return this.authService.login(action.payload).pipe(
      tap((response) => {
        ctx.dispatch(new AuthActions.LoginSuccess({
          user: response.user,
          token: response.accessToken,
          message: response.message,
        }));
      }),
      catchError((error) => {
        ctx.dispatch(new AuthActions.LoginFailure(error.message || 'Login failed'));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.LoginSuccess)
  loginSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.LoginSuccess) {
    const { user, token, message } = action.payload;

    this.storage.setToken(token);
    this.storage.setUser(user);

    ctx.patchState({
      user,
      token,
      isAuthenticated: true,
      isLoginLoading: false,
      isLoading: false,
      successMessage: message || 'Login successful!',
      errorMessage: null,
    });
  }

  @Action(AuthActions.LoginFailure)
  loginFailure(ctx: StateContext<AuthStateModel>, action: AuthActions.LoginFailure) {
    ctx.patchState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoginLoading: false,
      isLoading: false,
      errorMessage: action.error,
      successMessage: null,
    });
  }

  @Action(AuthActions.RestoreSession)
  restoreSession(ctx: StateContext<AuthStateModel>) {
    const token = this.storage.getToken();
    const user = this.storage.getUser();

    if (!token || !user) return;

    if (!user.id || !user.email || user.role !== 'admin') {
      this.storage.clear();
      ctx.setState(initialAuthState);
      return;
    }

    ctx.patchState({ user, token, isAuthenticated: true });
  }

  @Action(AuthActions.Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    this.storage.clear();
    ctx.setState(initialAuthState);
    this.router.navigate([APP_ROUTES.LOGIN]);
  }

  @Action(AuthActions.ClearAuthMessages)
  clearMessages(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({ successMessage: null, errorMessage: null });
  }
}
