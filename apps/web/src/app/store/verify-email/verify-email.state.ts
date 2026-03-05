import { Injectable, inject } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError, throwError } from 'rxjs';

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
    const state = ctx.getState();
    
    // Validate email exists before making API call
    if (!state.email || state.email.trim() === '') {
      ctx.patchState({
        isResendLoading: false,
        resendError: 'Unable to resend verification email. Please register again or contact support.'
      });
      return;
    }

    ctx.patchState({
      isResendLoading: true,
      resendError: null
    });

    return this.authService.resendVerificationEmail(state.email).pipe(
      tap(() => {
        ctx.dispatch(new VerifyEmailActions.ResendVerificationEmailSuccess());
      }),
      catchError((error) => {
        // Extract error message from various possible formats
        let errorMessage = 'Unable to resend verification email at this time. Please try again later or contact support.';
        
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.originalError?.error?.message) {
          errorMessage = error.originalError.error.message;
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        }
        
        ctx.dispatch(new VerifyEmailActions.ResendVerificationEmailFailure(errorMessage));
        return throwError(() => error);
      })
    );
  }

  @Action(VerifyEmailActions.ResendVerificationEmailSuccess)
  resendVerificationEmailSuccess(ctx: StateContext<VerifyEmailStateModel>) {
    ctx.patchState({
      isResendLoading: false,
      message: 'Verification email sent successfully! Please check your inbox and spam folder.',
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
