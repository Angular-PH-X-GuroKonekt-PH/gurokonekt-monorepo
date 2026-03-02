import { Component, inject, OnInit, effect } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { RegisterMenteeRequest } from '@gurokonekt/models';
import { AuthState } from '../../../store/auth';
import { ClearAuthMessages, RegisterMentee } from '../../../store/auth/auth.actions';
import { IconComponent } from '../../shared/icon/icon.component';
import { BaseStepperRegistrationComponent } from '../../shared/base-stepper-registration.component';
import { FORM_FIELD_VALIDATORS } from '../../../constants/form-validation-configs.constants';
import { CustomValidators } from '../../../validators/custom-validators';
import { formatPhoneToE164 } from '../../../helpers/phone.formatter';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register
  extends BaseStepperRegistrationComponent
  implements OnInit
{
  private readonly store = inject(Store);
  private readonly toastService = inject(ToastService);

  protected readonly isMenteeRegisterLoading = this.store.selectSignal(
    AuthState.isMenteeRegisterLoading
  );
  protected readonly errorMessage = this.store.selectSignal(
    AuthState.errorMessage
  );
  protected readonly successMessage = this.store.selectSignal(
    AuthState.successMessage
  );

  protected readonly totalSteps = 4;
  protected readonly stepTitles = [
    'Personal Information',
    'Contact Details',
    'Location & Language',
    'Confirmation',
  ];

  protected readonly registerForm: FormGroup;

  constructor() {
    super();

    this.registerForm = this.fb.group(
      {
        firstName: ['', FORM_FIELD_VALIDATORS.FIRST_NAME],
        lastName: ['', FORM_FIELD_VALIDATORS.LAST_NAME],
        email: ['', FORM_FIELD_VALIDATORS.EMAIL],
        phoneNumber: ['', FORM_FIELD_VALIDATORS.PHONE_NUMBER],
        password: ['', FORM_FIELD_VALIDATORS.PASSWORD],
        confirmPassword: ['', FORM_FIELD_VALIDATORS.CONFIRM_PASSWORD],
        country: ['PH', FORM_FIELD_VALIDATORS.COUNTRY],
        timezone: ['Asia/Manila', FORM_FIELD_VALIDATORS.TIMEZONE],
        language: ['en'],
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
        return !!form.get('firstName')?.valid && !!form.get('lastName')?.valid;
      case 2:
        return (
          !!form.get('email')?.valid &&
          !!form.get('phoneNumber')?.valid &&
          !!form.get('password')?.valid &&
          !!form.get('confirmPassword')?.valid
        );
      case 3:
        return !!form.get('country')?.valid && !!form.get('timezone')?.valid;
      case 4:
        return !!form.get('acceptTerms')?.valid;
      default:
        return form.valid;
    }
  }

  protected async onSubmit(): Promise<void> {
    if (!this.preSubmissionValidation()) {
      return;
    }

    this.startSubmission();

    try {
      const formData = this.registerForm.value;

      const registrationData: RegisterMenteeRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
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
      };

      this.store.dispatch(new RegisterMentee(registrationData));
    } catch {
      this.handleSubmissionError(
        'An unexpected error occurred. Please try again.'
      );
    }
  }
}
