import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { RegisterMenteeRequest } from '../../../types/api.types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly successMessage = signal<string>('');

  protected readonly registerForm: FormGroup;

  // Enhanced timezones with country associations
  protected readonly allTimezones = [
    // North America
    { value: 'America/New_York', label: 'Eastern Time (ET)', countries: ['US', 'CA'] },
    { value: 'America/Chicago', label: 'Central Time (CT)', countries: ['US', 'CA', 'MX'] },
    { value: 'America/Denver', label: 'Mountain Time (MT)', countries: ['US', 'CA', 'MX'] },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', countries: ['US', 'CA'] },
    { value: 'America/Sao_Paulo', label: 'Brazil Time (BRT)', countries: ['BR'] },
    { value: 'America/Mexico_City', label: 'Central Standard Time (CST)', countries: ['MX'] },
    // Europe
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', countries: ['GB'] },
    { value: 'Europe/Paris', label: 'Central European Time (CET)', countries: ['FR', 'DE', 'ES', 'IT', 'NL'] },
    { value: 'Europe/Stockholm', label: 'Central European Time (CET)', countries: ['SE', 'NO', 'DK', 'FI'] },
    // Asia Pacific
    { value: 'Asia/Manila', label: 'Philippine Standard Time (PST)', countries: ['PH'] },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', countries: ['JP'] },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', countries: ['CN'] },
    { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', countries: ['KR'] },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', countries: ['IN'] },
    { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', countries: ['SG'] },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', countries: ['AU'] },
  ];

  // Filtered timezones based on selected country
  protected readonly timezones = signal(this.allTimezones);

  // Common languages
  protected readonly languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'pt', label: 'Portuguese' },
  ];

  // Default timezone for each country
  private readonly countryTimezoneMap: { [key: string]: string } = {
    'PH': 'Asia/Manila',
    'US': 'America/New_York',
    'CA': 'America/New_York', 
    'GB': 'Europe/London',
    'AU': 'Australia/Sydney',
    'DE': 'Europe/Paris',
    'FR': 'Europe/Paris',
    'ES': 'Europe/Paris',
    'IT': 'Europe/Paris',
    'JP': 'Asia/Tokyo',
    'CN': 'Asia/Shanghai',
    'IN': 'Asia/Kolkata',
    'BR': 'America/Sao_Paulo',
    'MX': 'America/Mexico_City',
    'NL': 'Europe/Paris',
    'SE': 'Europe/Stockholm',
    'NO': 'Europe/Stockholm',
    'DK': 'Europe/Stockholm',
    'FI': 'Europe/Stockholm',
    'SG': 'Asia/Singapore',
    'KR': 'Asia/Seoul',
  };
  protected readonly countries = [
    { value: 'PH', label: 'Philippines' },
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'ES', label: 'Spain' },
    { value: 'IT', label: 'Italy' },
    { value: 'JP', label: 'Japan' },
    { value: 'CN', label: 'China' },
    { value: 'IN', label: 'India' },
    { value: 'BR', label: 'Brazil' },
    { value: 'MX', label: 'Mexico' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'SE', label: 'Sweden' },
    { value: 'NO', label: 'Norway' },
    { value: 'DK', label: 'Denmark' },
    { value: 'FI', label: 'Finland' },
    { value: 'SG', label: 'Singapore' },
    { value: 'KR', label: 'South Korea' },
  ];

  constructor() {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]+$/)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        country: ['', [Validators.required]],
        timezone: ['', [Validators.required]],
        language: ['en'],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );

    // Watch for country changes and update timezone accordingly
    this.registerForm.get('country')?.valueChanges.subscribe(countryCode => {
      this.onCountryChange(countryCode);
    });
  }

  ngOnInit(): void {
    // Scroll to top when component loads to fix page position issue
    window.scrollTo(0, 0);
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  protected onCountryChange(countryCode: string): void {
    if (!countryCode) {
      return;
    }

    // Always show all timezones (no filtering)
    this.timezones.set(this.allTimezones);

    // Auto-select the default timezone for this country
    const defaultTimezone = this.countryTimezoneMap[countryCode];
    if (defaultTimezone) {
      this.registerForm.patchValue({ timezone: defaultTimezone });
    }
  }

  protected async onSubmit(): Promise<void> {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const formData = this.registerForm.value;
      
      // Prepare payload with type safety
      const registrationData: RegisterMenteeRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        country: formData.country,
        timezone: formData.timezone,
        language: formData.language || 'en',
      };

      console.log('Registering mentee:', registrationData);

      // Call the AuthService
      this.authService.registerMentee(registrationData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          
          // Navigate to verification page with success message
          void this.router.navigate(['/verify-email'], {
            queryParams: { 
              email: registrationData.email,
              role: 'mentee',
              message: response.message || 'Registration successful! Please check your email to verify your account.' 
            },
          });
        },
        error: (error) => {
          console.error('Registration failed:', error);
          
          // Provide more user-friendly error messages
          let userMessage = 'Registration failed. Please try again.';
          
          if (error.status === 400) {
            userMessage = error.message || 'Please check your information and try again.';
          } else if (error.status === 409) {
            userMessage = 'An account with this email already exists. Please try logging in instead.';
          } else if (error.status === 500) {
            userMessage = 'Server error. Please try again in a few moments.';
          } else if (error.message) {
            userMessage = error.message;
          }
          
          this.errorMessage.set(userMessage);
          this.isSubmitting.set(false);
        },
        complete: () => {
          // Only set loading to false if there was an error
          // Success case is handled in navigation
        }
      });
      
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      this.errorMessage.set('An unexpected error occurred. Please try again.');
      this.isSubmitting.set(false);
    }
  }

  protected navigateToLogin(): void {
    void this.router.navigate(['/login']);
  }

  protected getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    const errors = control.errors;
    
    // Field-specific friendly messages
    switch (fieldName) {
      case 'firstName':
        if (errors['required']) return 'Please enter your first name';
        if (errors['minlength']) return 'First name must be at least 2 characters';
        break;
      case 'lastName':
        if (errors['required']) return 'Please enter your last name';
        if (errors['minlength']) return 'Last name must be at least 2 characters';
        break;
      case 'email':
        if (errors['required']) return 'Email address is required';
        if (errors['email']) return 'Please enter a valid email address (e.g., user@example.com)';
        break;
      case 'phoneNumber':
        if (errors['required']) return 'Phone number is required';
        if (errors['pattern']) return 'Please enter a valid phone number with country code';
        break;
      case 'password':
        if (errors['required']) return 'Password is required';
        if (errors['minlength']) return 'Password must be at least 8 characters long';
        if (errors['pattern']) return 'Password must contain uppercase letter, number, and special character (@$!%*?&)';
        break;
      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        break;
      case 'country':
        if (errors['required']) return 'Please select your country';
        break;
      case 'timezone':
        if (errors['required']) return 'Please select your timezone';
        break;
    }
    
    // Fallback to generic messages
    if (errors['required']) {
      return 'This field is required';
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (errors['pattern'] && fieldName === 'password') {
      return 'Password must include uppercase, number, and special character';
    }
    if (errors['pattern'] && fieldName === 'phoneNumber') {
      return 'Please enter a valid phone number';
    }
    if (errors['passwordMismatch']) {
      return 'Passwords do not match';
    }
    return '';
  }

  protected hasError(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  protected getFormCompletionPercentage(): number {
    const totalFields = Object.keys(this.registerForm.controls).length;
    const completedFields = Object.keys(this.registerForm.controls).filter(key => {
      const control = this.registerForm.get(key);
      return control && control.valid && control.value;
    }).length;
    
    return Math.round((completedFields / totalFields) * 100);
  }
}
