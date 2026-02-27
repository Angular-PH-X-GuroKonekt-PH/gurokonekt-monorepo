import { Injectable, inject } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';

import { AuthService } from '../../services/auth.service';
import { VerifyEmailStateModel, initialVerifyEmailState } from './verify-email.state.model';
import * as VerifyEmailActions from './verify-email.actions';

@State<VerifyEmailStateModel>({
  name: 'verifyEmail',
  defaults: initialVerifyEmailState
})
@Injectable()
export class VerifyEmailState {
  private readonly authService = inject(AuthService);

  @Selector()
  static email(state: VerifyEmailStateModel) {
    return state.email;
  }

  @Selector()
  static role(state: VerifyEmailStateModel) {
    return state.role;
  }

  @Selector()
  static message(state: VerifyEmailStateModel) {
    return state.message;
  }

  @Selector()
  static isResendLoading(state: VerifyEmailStateModel) {
    return state.isResendLoading;
  }

  @Selector()
  static resendError(state: VerifyEmailStateModel) {
    return state.resendError;
  }

  @Action(VerifyEmailActions.InitializeVerification)
  initializeVerification(
    ctx: StateContext<VerifyEmailStateModel>, 
    action: VerifyEmailActions.InitializeVerification
  ) {
    ctx.patchState({
      email: action.payload.email,
      role: action.payload.role,
      message: action.payload.message,
      resendError: null
    });
  }

  @Action(VerifyEmailActions.ResendVerificationEmail)
  resendVerificationEmail(ctx: StateContext<VerifyEmailStateModel>) {
    ctx.patchState({
      isResendLoading: true,
      resendError: null
    });

    // TODO: Replace with actual API call when backend is ready
    // const state = ctx.getState();
    // return this.authService.resendVerificationEmail(state.email).pipe(
    //   tap(() => {
    //     ctx.dispatch(new VerifyEmailActions.ResendVerificationEmailSuccess());
    //   }),
    //   catchError((error) => {
    //     ctx.dispatch(new VerifyEmailActions.ResendVerificationEmailFailure(
    //       error?.error?.message || 'Failed to resend verification email. Please try again.'
    //     ));
    //     return throwError(() => error);
    //   })
    // );

    // Simulate API call for now
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        ctx.dispatch(new VerifyEmailActions.ResendVerificationEmailSuccess());
        resolve();
      }, 1500);
    }).catch(() => {
      ctx.dispatch(new VerifyEmailActions.ResendVerificationEmailFailure(
        'Failed to resend verification email. Please try again.'
      ));
    });
  }

  @Action(VerifyEmailActions.ResendVerificationEmailSuccess)
  resendVerificationEmailSuccess(ctx: StateContext<VerifyEmailStateModel>) {
    ctx.patchState({
      isResendLoading: false,
      message: 'Verification email has been resent! Please check your inbox.',
      resendError: null
    });

    // Reset message after 3 seconds
    setTimeout(() => {
      ctx.dispatch(new VerifyEmailActions.ResetVerificationMessage());
    }, 3000);
  }

  @Action(VerifyEmailActions.ResendVerificationEmailFailure)
  resendVerificationEmailFailure(
    ctx: StateContext<VerifyEmailStateModel>, 
    action: VerifyEmailActions.ResendVerificationEmailFailure
  ) {
    ctx.patchState({
      isResendLoading: false,
      resendError: action.error
    });
  }

  @Action(VerifyEmailActions.ResetVerificationMessage)
  resetVerificationMessage(ctx: StateContext<VerifyEmailStateModel>) {
    ctx.patchState({
      message: ''
    });
  }
}
