import {
  Component,
  inject,
} from '@angular/core';
import {
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../shared/icon/icon.component';
import { FormSubmissionHelper } from '../../helpers/form-submission.helper';
import { RouterNavigationHelper } from '../../helpers/router-navigation.helper';
import { SignalStateHelper } from '../../helpers/signal-state.helper';
import { FormHelperService } from '../../services/form-helper.service';
import { BaseFormComponent } from '../shared/base-form.component';
import { LoginScenario } from '../../types/login.types';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login extends BaseFormComponent {
  private readonly router = inject(Router);
  private readonly formHelperService = inject(FormHelperService);
  private readonly passwordHelper = this.formHelperService.createPasswordHelper();

  protected readonly showPassword = this.passwordHelper.showPassword;
  protected readonly submissionState = SignalStateHelper.createSubmissionState();

  protected readonly loginForm: FormGroup = this.formHelperService.createLoginForm();
  protected readonly form: FormGroup = this.loginForm;

  protected togglePasswordVisibility(): void {
    this.passwordHelper.toggleVisibility();
  }

  protected async onSubmit(): Promise<void> {
    if (!FormSubmissionHelper.preSubmissionValidation(this.loginForm, this.submissionState.isLoading)) {
      return;
    }

    FormSubmissionHelper.startSubmission(this.submissionState);

    try {
      const formData = this.loginForm.getRawValue();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const simulateScenario = this.getLoginScenario();

      if (simulateScenario === 'unverified') {
        FormSubmissionHelper.handleSubmissionError(
          this.submissionState, 
          'Please verify your email before logging in.'
        );
        return;
      }

      if (simulateScenario === 'invalid') {
        FormSubmissionHelper.handleSubmissionError(
          this.submissionState,
          'Invalid email or password.'
        );
        return;
      }

      FormSubmissionHelper.handleSubmissionSuccess(this.submissionState);
      await RouterNavigationHelper.navigateToDashboard(this.router, 'mentee');
    } catch (error) {
      FormSubmissionHelper.handleSubmissionError(
        this.submissionState,
        'An error occurred. Please try again.'
      );
    }
  }

  private getLoginScenario(): LoginScenario {
    return 'success'; // 'success' | 'unverified' | 'invalid'
  }

  protected navigateToRegister(): void {
    RouterNavigationHelper.navigateToRegistration(this.router);
  }

  protected navigateToForgotPassword(): void {
    RouterNavigationHelper.navigateWithFallback(this.router, ['/forgot-password'], ['/login']);
  }
}
