import { Injectable, inject } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthResponse } from '@gurokonekt/models';

import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { NavigationHelper } from '../../helpers';
import { AuthStateModel, initialAuthState } from './auth.state.model';
import * as AuthActions from './auth.actions';

@State<AuthStateModel>({
  name: 'auth',
  defaults: initialAuthState
})
@Injectable()
export class AuthState {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly navigationHelper = new NavigationHelper();

  @Selector()
  static user(state: AuthStateModel) {
    return state.user;
  }

  @Selector()
  static isAuthenticated(state: AuthStateModel) {
    return state.isAuthenticated;
  }

  @Selector()
  static isLoading(state: AuthStateModel) {
    return state.isLoading;
  }

  @Selector()
  static isLoginLoading(state: AuthStateModel) {
    return state.isLoginLoading;
  }

  @Selector()
  static isMenteeRegisterLoading(state: AuthStateModel) {
    return state.isMenteeRegisterLoading;
  }

  @Selector()
  static isMentorRegisterLoading(state: AuthStateModel) {
    return state.isMentorRegisterLoading;
  }

  @Selector()
  static successMessage(state: AuthStateModel) {
    return state.successMessage;
  }

  @Selector()
  static errorMessage(state: AuthStateModel) {
    return state.errorMessage;
  }

  @Selector()
  static lastRegisteredEmail(state: AuthStateModel) {
    return state.lastRegisteredEmail;
  }

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
          message: response.message
        }));
      }),
      catchError((error) => {
        ctx.dispatch(new AuthActions.LoginFailure(this.getErrorMessage(error)));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.LoginSuccess)
  loginSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.LoginSuccess) {
    const { user, token, message } = action.payload;
    
    if (token) {
      localStorage.setItem('auth_token', token);
    }

    ctx.patchState({
      user,
      token: token || null,
      isAuthenticated: !!token,
      isLoginLoading: false,
      isLoading: false,
      successMessage: message || 'Login successful!',
      errorMessage: null
    });

    // Check if user profile is complete before navigating
    const isProfileComplete = user['isProfileComplete'] === true;
    const isMentorProfileComplete = user['isMentorProfileComplete'] === true;
    this.navigationHelper.navigateToDashboard(
      user.role,
      isProfileComplete,
      isMentorProfileComplete
    );
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
    
    ctx.patchState({
      isMenteeRegisterLoading: false,
      isLoading: false,
      successMessage: message,
      errorMessage: null,
      lastRegisteredEmail: email
    });

    // Navigate to verification page after showing success message
    setTimeout(() => {
      this.navigationHelper.navigateToVerifyEmail({
        email,
        role: 'mentee',
        message
      });
    }, 3000); // 3 second delay
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
    
    ctx.patchState({
      isMentorRegisterLoading: false,
      isLoading: false,
      successMessage: message,
      errorMessage: null,
      lastRegisteredEmail: email
    });

    setTimeout(() => {
      this.navigationHelper.navigateToVerifyEmail({
        email,
        role: 'mentor',
        message
      });
    }, 3000);
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
    ctx.patchState({
      isLoading: true,
      errorMessage: null,
      successMessage: null
    });

    return this.profileService.updateMenteeProfile(
      action.payload.userId,
      action.payload.profileData,
      action.payload.avatarFile
    ).pipe(
      tap(() => {
        ctx.dispatch(new AuthActions.UpdateMenteeProfileSuccess('Profile updated successfully!'));
      }),
      catchError((error) => {
        ctx.dispatch(new AuthActions.UpdateMenteeProfileFailure(this.getErrorMessage(error)));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.UpdateMenteeProfileSuccess)
  updateMenteeProfileSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMenteeProfileSuccess) {
    const state = ctx.getState();
    if (!state.user) return;

    ctx.patchState({
      user: {
        ...state.user,
        isProfileComplete: true,
      },
      isLoading: false,
      successMessage: action.message || 'Profile updated successfully!',
      errorMessage: null
    });
  }

  @Action(AuthActions.UpdateMenteeProfileFailure)
  updateMenteeProfileFailure(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMenteeProfileFailure) {
    ctx.patchState({
      isLoading: false,
      errorMessage: action.error,
      successMessage: null
    });
  }

  @Action(AuthActions.UpdateMentorProfile)
  updateMentorProfile(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMentorProfile) {
    ctx.patchState({
      isLoading: true,
      errorMessage: null,
      successMessage: null
    });

    return this.profileService.updateMentorProfile(
      action.payload.userId,
      action.payload.profileData,
      action.payload.avatarFile
    ).pipe(
      tap(() => {
        ctx.dispatch(new AuthActions.UpdateMentorProfileSuccess('Mentor profile updated successfully!'));
      }),
      catchError((error) => {
        ctx.dispatch(new AuthActions.UpdateMentorProfileFailure(this.getErrorMessage(error)));
        return throwError(() => error);
      })
    );
  }

  @Action(AuthActions.UpdateMentorProfileSuccess)
  updateMentorProfileSuccess(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMentorProfileSuccess) {
    const state = ctx.getState();
    if (!state.user) return;

    ctx.patchState({
      user: {
        ...state.user,
        isMentorProfileComplete: true,
      },
      isLoading: false,
      successMessage: action.message || 'Mentor profile updated successfully!',
      errorMessage: null
    });
  }

  @Action(AuthActions.UpdateMentorProfileFailure)
  updateMentorProfileFailure(ctx: StateContext<AuthStateModel>, action: AuthActions.UpdateMentorProfileFailure) {
    ctx.patchState({
      isLoading: false,
      errorMessage: action.error,
      successMessage: null
    });
  }

  @Action(AuthActions.Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    localStorage.removeItem('auth_token');
    
    ctx.patchState(initialAuthState);
    
    this.navigationHelper.navigateToLogin();
  }

  @Action(AuthActions.ClearAuthMessages)
  clearMessages(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({
      successMessage: null,
      errorMessage: null
    });
  }

  @Action(AuthActions.ResetAuthState)
  resetState(ctx: StateContext<AuthStateModel>) {
    ctx.setState(initialAuthState);
  }

  private getErrorMessage(error: { status?: number; message?: string; originalError?: unknown; error?: unknown }): string {
    const originalError = error?.originalError as { status?: number; error?: { message?: string } } | undefined;
    const payloadError = error?.error as { message?: string } | undefined;
    const status = error?.status ?? originalError?.status;
    const serverMessage =
      originalError?.error?.message ||
      payloadError?.message ||
      error?.message;

    if (status === 400) {
      return serverMessage || 'Please check your information and try again.';
    } else if (status === 401) {
      return 'Invalid email or password. Please try again.';
    } else if (status === 403) {
      return 'Please verify your email before logging in.';
    } else if (status === 409) {
      return 'An account with this email already exists. Please try logging in instead.';
    } else if (status === 429) {
      return serverMessage || 'Too many login attempts. Please try again later.';
    } else if (status === 500) {
      return 'Server error. Please try again in a few moments.';
    } else if (serverMessage) {
      return serverMessage;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}