import { Selector } from '@ngxs/store';
import { AuthState } from './auth.state';
import { AuthStateModel } from '../models/auth.state.model';

export class AuthSelectors {
  @Selector([AuthState])
  static user(state: AuthStateModel) {
    return state.user;
  }

  @Selector([AuthState])
  static isAuthenticated(state: AuthStateModel) {
    return state.isAuthenticated;
  }

  @Selector([AuthState])
  static isLoginLoading(state: AuthStateModel) {
    return state.isLoginLoading;
  }

  @Selector([AuthState])
  static isLoading(state: AuthStateModel) {
    return state.isLoading;
  }

  @Selector([AuthState])
  static errorMessage(state: AuthStateModel) {
    return state.errorMessage;
  }

  @Selector([AuthState])
  static successMessage(state: AuthStateModel) {
    return state.successMessage;
  }
}
