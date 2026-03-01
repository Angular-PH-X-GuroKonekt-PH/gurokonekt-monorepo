import { Component, inject, OnInit, effect } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { RegisterMentorRequest } from '@gurokonekt/models';
import { AuthState } from '../../../store/auth';
import { ClearAuthMessages, RegisterMentor } from '../../../store/auth/auth.actions';

import { IconComponent } from '../../shared/icon/icon.component';
import { BaseStepperRegistrationComponent } from '../../shared/base-stepper-registration.component';
import { FORM_FIELD_VALIDATORS } from '../../../constants/form-validation-configs.constants';
import { CustomValidators } from '../../../validators/custom-validators';
import { ExpertiseSelectionHelper } from '../../../helpers/expertise-selection.helper';
import { LocationDataHelper } from '../../../helpers/location-data.helper';
import { formatPhoneToE164 } from '../../../helpers/phone.formatter';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-mentor-register',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class MentorRegister
  extends BaseStepperRegistrationComponent
  implements OnInit
{
  private readonly store = inject(Store);
  private readonly toastService = inject(ToastService);

  protected readonly isMentorRegisterLoading = this.store.selectSignal(
    AuthState.isMentorRegisterLoading
  );
  protected readonly errorMessage = this.store.selectSignal(
    AuthState.errorMessage
  );
  protected readonly successMessage = this.store.selectSignal(
    AuthState.successMessage
  );

  protected readonly totalSteps = 5;
  protected readonly stepTitles = [
    'Personal Information',
    'Security',
    'Location',
    'Professional Details',
    'Review & Confirm',
  ];

  protected readonly registerForm: FormGroup;
  protected readonly expertiseOptions =
    ExpertiseSelectionHelper.EXPERTISE_OPTIONS;
  protected selectedFiles: File[] = [];

  constructor() {
    super();

    this.registerForm = this.fb.group(
      {
        firstName: ['', FORM_FIELD_VALIDATORS.FIRST_NAME],
        middleName: ['', FORM_FIELD_VALIDATORS.MIDDLE_NAME],
        lastName: ['', FORM_FIELD_VALIDATORS.LAST_NAME],
        suffix: ['', FORM_FIELD_VALIDATORS.SUFFIX],
        email: ['', FORM_FIELD_VALIDATORS.EMAIL],
        phoneNumber: ['', FORM_FIELD_VALIDATORS.PHONE_NUMBER],
        password: ['', FORM_FIELD_VALIDATORS.PASSWORD],
        confirmPassword: ['', FORM_FIELD_VALIDATORS.CONFIRM_PASSWORD],
        country: ['PH', FORM_FIELD_VALIDATORS.COUNTRY],
        timezone: ['Asia/Manila', FORM_FIELD_VALIDATORS.TIMEZONE],
        language: ['en'],
        areasOfExpertise: [[], [Validators.required, Validators.minLength(1)]],
        yearsOfExperience: [
          null,
          [Validators.required, Validators.min(1), Validators.max(60)],
        ],
        linkedInUrl: ['', FORM_FIELD_VALIDATORS.LINKEDIN_URL],
        files: [[]],
        acceptTerms: [false, FORM_FIELD_VALIDATORS.ACCEPT_TERMS],
      },
      { validators: CustomValidators.passwordMatchValidator }
    );

    // Setup intelligent form auto-population: phone → country → timezone
    this.setupFormAutoPopulation();
    
    // Watch for success and error messages from auth state
    effect(() => {
      const successMsg = this.successMessage();
      const errorMsg = this.errorMessage();
      
      if (successMsg) {
        this.toastService.success(successMsg, 'Welcome to GuroKonekt!');
        this.store.dispatch(new ClearAuthMessages());
      }
      
      if (errorMsg) {
        this.toastService.error(errorMsg, 'Registration Failed');
        this.store.dispatch(new ClearAuthMessages());
      }
    });
  }

  ngOnInit(): void {
    this.scrollToTop();
  }

  protected override isCurrentStepValid(): boolean {
    const currentStep = this.currentStep();
    const form = this.registerForm;

    switch (currentStep) {
      case 1:
        return (
          !!form.get('firstName')?.valid &&
          !!form.get('lastName')?.valid &&
          !!form.get('email')?.valid &&
          !!form.get('phoneNumber')?.valid
        );
      case 2:
        return (
          !!form.get('password')?.valid && !!form.get('confirmPassword')?.valid
        );
      case 3:
        return !!form.get('country')?.valid && !!form.get('timezone')?.valid;
      case 4: {
        const linkedInControl = form.get('linkedInUrl');
        const isLinkedInValid =
          !linkedInControl?.value || linkedInControl?.valid;
        return (
          !!form.get('areasOfExpertise')?.valid &&
          !!form.get('yearsOfExperience')?.valid &&
          isLinkedInValid &&
          this.selectedFiles.length > 0
        );
      }
      case 5:
        return !!form.get('acceptTerms')?.valid;
      default:
        return form.valid;
    }
  }

  protected onExpertiseChange(event: Event, expertise: string): void {
    ExpertiseSelectionHelper.handleExpertiseChange(
      event,
      expertise,
      this.registerForm
    );
  }

  protected isExpertiseSelected(expertise: string): boolean {
    return ExpertiseSelectionHelper.isExpertiseSelected(
      expertise,
      this.registerForm
    );
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Only take the first file (single upload)
      const file = input.files[0];

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        this.handleSubmissionError(
          'File size exceeds 10MB limit. Please choose a smaller file.'
        );
        input.value = ''; // Clear the input
        this.selectedFiles = [];
        return;
      }

      this.selectedFiles = [file];
      this.registerForm.patchValue({ files: this.selectedFiles });
    }
  }

  protected async onSubmit(): Promise<void> {
    if (!this.preSubmissionValidation()) {
      return;
    }

    this.startSubmission();

    try {
      const formData = this.registerForm.value;

      const registrationData: RegisterMentorRequest = {
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        suffix: formData.suffix || undefined,
        email: formData.email,
        phoneNumber: formatPhoneToE164(
          formData.phoneNumber,
          formData.country || 'PH'
        ),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        country: formData.country,
        timezone: formData.timezone,
        language: formData.language || 'en',
        yearsOfExperience: formData.yearsOfExperience,
        linkedInUrl: formData.linkedInUrl || undefined,
        areasOfExpertise: formData.areasOfExpertise || [],
        files: this.selectedFiles,
      };

      this.store.dispatch(new RegisterMentor(registrationData));
    } catch (error) {
      console.error('Registration error:', error);
      this.handleSubmissionError(
        'An unexpected error occurred. Please try again.'
      );
    }
  }

  protected getCountryLabel(value: string | null): string {
    if (!value) return 'Not specified';
    return LocationDataHelper.getCountryDisplayName(value);
  }

  protected getLanguageLabel(value: string | null): string {
    if (!value) return 'English';
    return LocationDataHelper.getLanguageDisplayName(value);
  }
}
