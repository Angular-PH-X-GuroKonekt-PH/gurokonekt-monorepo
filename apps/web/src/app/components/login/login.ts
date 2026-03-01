import {
  Component,
  inject,
  effect,
} from '@angular/core';
import {
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { IconComponent } from '../shared/icon/icon.component';
import { FormSubmissionHelper } from '../../helpers/form-submission.helper';
import { RouterNavigationHelper } from '../../helpers/router-navigation.helper';
import { FormHelperService } from '../../services/form-helper.service';
import { ToastService } from '../../services/toast.service';
import { BaseFormComponent } from '../shared/base-form.component';
import { AuthState } from '../../store/auth/auth.state';
import * as AuthActions from '../../store/auth/auth.actions';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login extends BaseFormComponent {
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly formHelperService = inject(FormHelperService);
  private readonly toastService = inject(ToastService);
  private readonly passwordHelper = this.formHelperService.createPasswordHelper();

  protected readonly showPassword = this.passwordHelper.showPassword;

  // NGXS Selectors
  @Select(AuthState.isLoginLoading) isLoading$!: Observable<boolean>;
  @Select(AuthState.errorMessage) errorMessage$!: Observable<string | null>;
  @Select(AuthState.successMessage) successMessage$!: Observable<string | null>;

  // Signals from store
  protected readonly isLoading = this.store.selectSignal(AuthState.isLoginLoading);
  protected readonly errorMessage = this.store.selectSignal(AuthState.errorMessage);
  protected readonly successMessage = this.store.selectSignal(AuthState.successMessage);

  protected readonly loginForm: FormGroup = this.formHelperService.createLoginForm();
  protected readonly form: FormGroup = this.loginForm;

  constructor() {
    super();

    // Watch for success/error messages and show toasts
    effect(() => {
      const successMsg = this.successMessage();
      const errorMsg = this.errorMessage();
      
      if (successMsg) {
        this.toastService.success(successMsg, 'Welcome Back!');
      }
      
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });
  }

  protected togglePasswordVisibility(): void {
    this.passwordHelper.toggleVisibility();
  }

  protected async onSubmit(): Promise<void> {
    if (!FormSubmissionHelper.preSubmissionValidation(this.loginForm, this.isLoading)) {
      return;
    }

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.store.dispatch(new AuthActions.Login(credentials));
  }

  protected navigateToRegister(): void {
    RouterNavigationHelper.navigateToRegistration(this.router);
  }

  protected navigateToForgotPassword(): void {
    RouterNavigationHelper.navigateWithFallback(this.router, ['/forgot-password'], ['/login']);
  }
}
