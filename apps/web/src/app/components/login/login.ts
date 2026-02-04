import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';

type LoginScenario = 'success' | 'unverified' | 'invalid';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly showPassword = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string>('');

  protected readonly loginForm: FormGroup = this.createLoginForm();

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  protected async onSubmit(): Promise<void> {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      // TODO: Implement API call to login user
      const formData = this.loginForm.getRawValue();
      console.log('Login data:', formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Replace with actual API response handling
      // Simulate different scenarios for testing
      // Use getScenario() to prevent type narrowing
      const simulateScenario = this.getLoginScenario();

      if (simulateScenario === 'unverified') {
        this.errorMessage.set('Please verify your email before logging in.');
        this.isSubmitting.set(false);
        return;
      }

      if (simulateScenario === 'invalid') {
        this.errorMessage.set('Invalid email or password.');
        this.isSubmitting.set(false);
        return;
      }

      // Success scenario - redirect to dashboard
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login failed:', error);
      this.errorMessage.set('An error occurred. Please try again.');
      this.isSubmitting.set(false);
    }
  }

  private getLoginScenario(): LoginScenario {
    return 'success'; // 'success' | 'unverified' | 'invalid'
  }

  protected navigateToRegister(): void {
    void this.router.navigate(['/choose-role']);
  }

  protected navigateToForgotPassword(): void {
    // TODO: Implement forgot password flow
    void this.router.navigate(['/forgot-password']);
  }

  protected getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (!control?.touched || !control?.errors) {
      return '';
    }

    return this.mapErrorToMessage(fieldName, control.errors);
  }

  private mapErrorToMessage(fieldName: string, errors: ValidationErrors): string {
    if (errors['required']) {
      return 'This field is required';
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['minlength']) {
      const minLength = errors['minlength']['requiredLength'] as number;
      return `Minimum ${minLength} characters required`;
    }
    return '';
  }

  protected hasError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }
}
