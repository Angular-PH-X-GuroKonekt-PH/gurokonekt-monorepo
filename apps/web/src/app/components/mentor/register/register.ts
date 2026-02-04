import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { RegisterMentorRequest } from '../../../types/api.types';

@Component({
  selector: 'app-mentor-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorRegister implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly registerForm: FormGroup;

  protected readonly countries = [
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'IN', label: 'India' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'SG', label: 'Singapore' },
  ];

  protected readonly timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Africa/Lagos', label: 'West Africa Time (WAT)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  ];

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

  protected readonly expertiseOptions = [
    'Software Engineering',
    'Frontend',
    'Backend',
    'DevOps',
    'Cloud',
    'Data Science',
    'Product Management',
    'UI/UX Design',
    'Cybersecurity',
    'Mobile Development',
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
        expertiseAreas: [[], [Validators.required, Validators.minLength(1)]],
        yearsOfExperience: [
          null,
          [Validators.required, Validators.min(1), Validators.max(60)],
        ],
        linkedInUrl: [
          '',
          [
            Validators.required,
            Validators.pattern(
              // Basic LinkedIn URL validation
              /^(https?:\/\/)?([\w-]+\.)*linkedin\.com\/.+$/i
            ),
          ],
        ],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
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

  // TODO: Implement file validation when backend supports file upload
  // private filesValidator(control: FormControl): { [key: string]: boolean } | null {
  //   const files: FileList | null = control.value;
  //   if (!files || files.length === 0) {
  //     return { required: true };
  //   }
  //   const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  //   for (let i = 0; i < files.length; i++) {
  //     const file = files.item(i)!;
  //     const isPdf = file.type === 'application/pdf';
  //     const isImage = file.type.startsWith('image/');
  //     if (!(isPdf || isImage)) {
  //       return { invalidType: true };
  //     }
  //     if (file.size > maxSizeBytes) {
  //       return { fileTooLarge: true };
  //     }
  //   }
  //   return null;
  // }

  protected togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  protected onExpertiseChange(event: Event, expertise: string): void {
    const checkbox = event.target as HTMLInputElement;
    const currentAreas = this.registerForm.get('expertiseAreas')?.value || [];
    
    if (checkbox.checked) {
      // Add expertise if not already included
      if (!currentAreas.includes(expertise)) {
        currentAreas.push(expertise);
      }
    } else {
      // Remove expertise if unchecked
      const index = currentAreas.indexOf(expertise);
      if (index > -1) {
        currentAreas.splice(index, 1);
      }
    }
    
    this.registerForm.patchValue({ expertiseAreas: currentAreas });
  }

  protected onFilesSelected(event: Event): void {
    // TODO: Implement file upload when backend supports it
    const input = event.target as HTMLInputElement;
    const files = input.files;
    console.log('Files selected (not yet supported by backend):', files);
  }

  protected async onSubmit(): Promise<void> {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const formData = this.registerForm.value;
      
      // Prepare payload with type safety
      const registrationData: RegisterMentorRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        country: formData.country,
        timezone: formData.timezone,
        language: formData.language || 'en',
        yearsOfExperience: formData.yearsOfExperience,
        linkedInUrl: formData.linkedInUrl,
      };

      console.log('Registering mentor:', registrationData);

      // Call the AuthService
      this.authService.registerMentor(registrationData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          
          // Navigate to verification page with success message
          void this.router.navigate(['/verify-email'], {
            queryParams: { 
              email: registrationData.email,
              role: 'mentor',
              message: response.message || 'Registration successful! Your application is pending approval. Please check your email to verify your account.' 
            },
          });
        },
        error: (error) => {
          console.error('Registration failed:', error);
          this.errorMessage.set(error.message || 'Registration failed. Please try again.');
          this.isSubmitting.set(false);
        }
      });
    } catch (error) {
      console.error('Mentor registration failed:', error);
      this.errorMessage.set('An unexpected error occurred. Please try again.');
      this.isSubmitting.set(false);
    }
  }

  protected getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    const errors = control.errors;
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
    if (fieldName === 'linkedInUrl' && errors['pattern']) {
      return 'Please enter a valid LinkedIn profile URL';
    }
    if (fieldName === 'yearsOfExperience') {
      if (errors['min']) return 'Must be at least 1 year';
      if (errors['max']) return 'Must be less than or equal to 60 years';
    }
    if (fieldName === 'expertiseAreas' && errors['required']) {
      return 'Select at least one expertise area';
    }
    // TODO: Add back when backend supports file upload
    // if (fieldName === 'verificationFiles') {
    //   if (errors['required']) return 'Please upload verification documents';
    //   if (errors['invalidType']) return 'Only PDF or image files are allowed';
    //   if (errors['fileTooLarge']) return 'Each file must be under 10MB';
    // }
    return '';
  }

  protected hasError(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
