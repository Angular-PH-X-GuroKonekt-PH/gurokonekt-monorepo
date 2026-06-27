import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthResponse } from '@gurokonekt/models/interfaces/auth/auth-response.interface';

import { AuthService } from '../services/auth.service';
import { ProfileService } from '../../../core/profile/profile.service';
import { AuthStateModel, initialAuthState } from '../models/auth.state.model';
import { AuthStorageService } from '../../storage/auth-storage.service';
import { APP_ROUTES } from '../../../shared/constants/routes';
import { ToastService } from '../../../shared/services/toast.service';
import { isSessionExpiredError, SESSION_EXPIRED_MESSAGE } from '../../../shared/utils/http-error.util';
import * as AuthActions from './auth.actions';

@State<AuthStateModel>({
  name: 'auth',
  defaults: initialAuthState
})
@Injectable()
export class AuthState {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly storage = inject(AuthStorageService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);


  @Action(AuthActions.Login)
  login(ctx: StateContext<AuthStateModel>, action: AuthActions.Login) {
    ctx.patchState({
      isLoginLoading: true,
      isLoading: true,
      errorMessage: null,
      successMessage: null
    });

    return this.authService.login(action.payload).pipe(
      tap((response: AuthResponse) => {
        ctx.dispatch(new AuthActions.LoginSuccess({
          user: response.user,
          token: response.accessToken,
          refreshToken: response.refreshToken,
          message: response.message
        }));
      }),
      catchError((error) => {
        ctx.dispatch(new AuthActions.LoginFailure(this.getErrorMessage(error)));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.RestoreSession)
  restoreSession(ctx: StateContext<AuthStateModel>) {
    const token = this.storage.getToken();
    const refreshToken = this.storage.getRefreshToken();
    const user = this.storage.getUser();

    if (!token || !user) {
      return;
    }

    if (!user.id || !user.email || !user.role) {
      this.storage.clear();
      ctx.setState(initialAuthState);
      return;
    }

    ctx.patchState({ user, token, refreshToken, isAuthenticated: true });
  }

  @Action(AuthActions.LoginSuccess)
  loginSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.LoginSuccess) {
    const { user, token, refreshToken, message } = action.payload;

    if (token) {
      this.storage.setToken(token);
      this.storage.setUser(user);
    }

    if (refreshToken) {
      this.storage.setRefreshToken(refreshToken);
    }

    ctx.patchState({
      user,
      token: token || null,
      refreshToken: refreshToken || null,
      isAuthenticated: !!token,
      isLoginLoading: false,
      isLoading: false,
      successMessage: message || 'Login successful!',
      errorMessage: null
    });

    // Navigation is handled by the calling component (login-page.ts)
    // via the navigateAfterLogin selector so action handlers stay pure.
  }

  @Action(AuthActions.LoginFailure)
  loginFailure(ctx: StateContext<AuthStateModel>, action: AuthActions.LoginFailure) {
    ctx.patchState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoginLoading: false,
      isLoading: false,
      errorMessage: action.error,
      successMessage: null
    });
  }

  @Action(AuthActions.RegisterMentee)
  registerMentee(ctx: StateContext<AuthStateModel>, action: AuthActions.RegisterMentee) {
    ctx.patchState({
      isMenteeRegisterLoading: true,
      isLoading: true,
      errorMessage: null,
      successMessage: null
    });

    return this.authService.registerMentee(action.payload).pipe(
      tap((response) => {
        ctx.dispatch(new AuthActions.RegisterMenteeSuccess({
          message: response.message || 'Thank you for joining GuroKonekt! We have sent you an email to verify your account.',
          email: action.payload.email
        }));
      }),
      catchError((error) => {
        ctx.dispatch(new AuthActions.RegisterMenteeFailure(this.getErrorMessage(error)));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.RegisterMenteeSuccess)
  registerMenteeSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.RegisterMenteeSuccess) {
    const { message, email } = action.payload;

    this.storage.setLastRegisteredEmail(email);

    ctx.patchState({
      isMenteeRegisterLoading: false,
      isLoading: false,
      successMessage: message,
      errorMessage: null,
      lastRegisteredEmail: email
    });
  }

  @Action(AuthActions.RegisterMenteeFailure)
  registerMenteeFailure(ctx: StateContext<AuthStateModel>, action: AuthActions.RegisterMenteeFailure) {
    ctx.patchState({
      isMenteeRegisterLoading: false,
      isLoading: false,
      errorMessage: action.error,
      successMessage: null
    });
  }

  @Action(AuthActions.RegisterMentor)
  registerMentor(ctx: StateContext<AuthStateModel>, action: AuthActions.RegisterMentor) {
    ctx.patchState({
      isMentorRegisterLoading: true,
      isLoading: true,
      errorMessage: null,
      successMessage: null
    });

    return this.authService.registerMentor(action.payload).pipe(
      tap((response) => {
        ctx.dispatch(new AuthActions.RegisterMentorSuccess({
          message: response.message || 'Thank you for joining GuroKonekt! We have sent you an email to verify your account.',
          email: action.payload.email
        }));
      }),
      catchError((error) => {
        ctx.dispatch(new AuthActions.RegisterMentorFailure(this.getErrorMessage(error)));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.RegisterMentorSuccess)
  registerMentorSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.RegisterMentorSuccess) {
    const { message, email } = action.payload;

    this.storage.setLastRegisteredEmail(email);

    ctx.patchState({
      isMentorRegisterLoading: false,
      isLoading: false,
      successMessage: message,
      errorMessage: null,
      lastRegisteredEmail: email
    });
  }

  @Action(AuthActions.RegisterMentorFailure)
  registerMentorFailure(ctx: StateContext<AuthStateModel>, action: AuthActions.RegisterMentorFailure) {
    ctx.patchState({
      isMentorRegisterLoading: false,
      isLoading: false,
      errorMessage: action.error,
      successMessage: null
    });
  }

  @Action(AuthActions.UpdateMenteeProfile)
  updateMenteeProfile(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMenteeProfile) {
    ctx.patchState({ isLoading: true, errorMessage: null, successMessage: null });

    return this.profileService.updateMenteeProfile(
      action.payload.userId,
      action.payload.profileData,
      action.payload.avatarFile
    ).pipe(
      tap(() => {
        ctx.dispatch(new AuthActions.UpdateMenteeProfileSuccess('Profile updated successfully!'));
      }),
      catchError((error) => {
        if (this.isSessionExpiredFailure(error)) {
          this.dispatchSessionExpiredIfNeeded(ctx);
          return throwError(() => error);
        }

        ctx.dispatch(new AuthActions.UpdateMenteeProfileFailure(this.getErrorMessage(error)));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.UpdateMenteeProfileSuccess)
  updateMenteeProfileSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMenteeProfileSuccess) {
    const state = ctx.getState();
    if (!state.user) return;

    const updatedUser = { ...state.user, isProfileComplete: true };
    this.storage.setUser(updatedUser);

    ctx.patchState({
      user: updatedUser,
      isLoading: false,
      successMessage: action.message || 'Profile updated successfully!',
      errorMessage: null
    });
  }

  @Action(AuthActions.UpdateMenteeProfileFailure)
  updateMenteeProfileFailure(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMenteeProfileFailure) {
    ctx.patchState({ isLoading: false, errorMessage: action.error, successMessage: null });
  }

  @Action(AuthActions.UpdateMentorProfile)
  updateMentorProfile(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMentorProfile) {
    ctx.patchState({ isLoading: true, errorMessage: null, successMessage: null });

    return this.profileService.updateMentorProfile(
      action.payload.userId,
      action.payload.profileData,
      action.payload.avatarFile
    ).pipe(
      tap(() => {
        ctx.dispatch(new AuthActions.UpdateMentorProfileSuccess('Mentor profile updated successfully!'));
      }),
      catchError((error) => {
        if (this.isSessionExpiredFailure(error)) {
          this.dispatchSessionExpiredIfNeeded(ctx);
          return throwError(() => error);
        }

        ctx.dispatch(new AuthActions.UpdateMentorProfileFailure(this.getErrorMessage(error)));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.UpdateMentorProfileSuccess)
  updateMentorProfileSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMentorProfileSuccess) {
    const state = ctx.getState();
    if (!state.user) return;

    const updatedUser = { ...state.user, isMentorProfileComplete: true };
    this.storage.setUser(updatedUser);

    ctx.patchState({
      user: updatedUser,
      isLoading: false,
      successMessage: action.message || 'Mentor profile updated successfully!',
      errorMessage: null
    });
  }

  @Action(AuthActions.UpdateMentorProfileFailure)
  updateMentorProfileFailure(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMentorProfileFailure) {
    ctx.patchState({ isLoading: false, errorMessage: action.error, successMessage: null });
  }

  @Action(AuthActions.Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    this.storage.clear();
    ctx.patchState(initialAuthState);
    this.router.navigate([APP_ROUTES.LOGIN]);
  }

  @Action(AuthActions.SessionExpired)
  sessionExpired(ctx: StateContext<AuthStateModel>) {
    this.storage.clear();
    ctx.setState(initialAuthState);
    this.toastService.error(SESSION_EXPIRED_MESSAGE, 'Session Expired');
    void this.router.navigate([APP_ROUTES.LOGIN]);
  }

  @Action(AuthActions.ClearAuthMessages)
  clearMessages(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({ successMessage: null, errorMessage: null });
  }

  @Action(AuthActions.ResetAuthState)
  resetState(ctx: StateContext<AuthStateModel>) {
    this.storage.clear();
    ctx.setState(initialAuthState);
  }

  private getErrorMessage(error: { status?: number; statusCode?: number; message?: string; originalError?: unknown; error?: unknown }): string {
    const originalError = error?.originalError as { status?: number; url?: string; error?: { message?: string; errorCode?: string } } | undefined;
    const payloadError = error?.error as { message?: string; errorCode?: string } | undefined;
    const status = error?.status ?? error?.statusCode ?? originalError?.status;
    const errorCode = payloadError?.errorCode ?? originalError?.error?.errorCode;
    const serverMessage =
      originalError?.error?.message ||
      payloadError?.message ||
      error?.message;

    if (status === 400) return serverMessage || 'Please check your information and try again.';
    if (status === 401) {
      if (errorCode === 'SESSION_EXPIRED') {
        return 'Your session has expired. Please log in again.';
      }

      const url = originalError?.url ?? '';
      const isLoginRequest = url.includes('/auth/login');
      if (!isLoginRequest && url) {
        return 'Your session has expired. Please log in again.';
      }

      return 'Invalid email or password. Please try again.';
    }
    if (status === 403) return 'Please verify your email before logging in.';
    if (status === 409) return 'An account with this email already exists. Please try logging in instead.';
    if (status === 429) return serverMessage || 'Too many login attempts. Please try again later.';
    if (status === 500) return 'Server error. Please try again in a few moments.';
    if (serverMessage) return serverMessage;

    return 'An unexpected error occurred. Please try again.';
  }

  private isSessionExpiredFailure(error: unknown): boolean {
    return isSessionExpiredError(error);
  }

  private dispatchSessionExpiredIfNeeded(ctx: StateContext<AuthStateModel>): void {
    if (ctx.getState().isAuthenticated) {
      ctx.dispatch(new AuthActions.SessionExpired());
    }
  }
}
