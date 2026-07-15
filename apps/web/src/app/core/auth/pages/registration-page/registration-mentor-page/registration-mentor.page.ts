import { ChangeDetectionStrategy, Component, inject, OnInit, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { RegisterMentorRequest } from '@gurokonekt/models/interfaces/auth/register-mentor-request.interface';
import { RegisterMentor } from '../../../store/auth.actions';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { BaseStepperRegistrationComponent } from '../../../../../shared/base-form/base-stepper-registration.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import { createFormConfig } from 'apps/web/src/app/shared/constants';
import { getCountryDisplayName, getLanguageDisplayName } from 'apps/web/src/app/shared/utils';
import {
  expertiseOptions,
  handleExpertiseChange,
  isExpertiseSelected,
} from 'apps/web/src/app/shared/helpers/expertise-selection.helper';
import { formatPhoneToE164 } from 'apps/web/src/app/shared/utils/phone.util';
import { APP_ROUTES } from 'apps/web/src/app/shared/constants/routes';
import { buildVerifyEmailRedirectUrl } from 'apps/web/src/app/shared/utils/email-verification.util';
import { AuthSelectors } from '../../../store/auth.selectors';
import { watchRegistrationOutcome } from '../../../helpers/registration-outcome.helper';
import { RegistrationStepNavComponent } from '../registration-step-nav/registration-step-nav.component';
import { RegistrationShellComponent } from '../registration-shell/registration-shell.component';
import { RegistrationStepperComponent } from '../registration-stepper/registration-stepper.component';
import { RegistrationLoginLinkComponent } from '../registration-login-link/registration-login-link.component';
import { RegistrationPasswordFieldsComponent } from '../registration-password-fields/registration-password-fields.component';
import { RegistrationNameFieldsComponent } from '../registration-name-fields/registration-name-fields.component';
import { RegistrationPhoneFieldComponent } from '../registration-phone-field/registration-phone-field.component';
import { RegistrationLocationFieldsComponent } from '../registration-location-fields/registration-location-fields.component';
import { RegistrationEmailFieldComponent } from '../registration-email-field/registration-email-field.component';
import { RegistrationReviewStepComponent } from '../registration-review-step/registration-review-step.component';

@Component({
  selector: 'app-registration-mentor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IconComponent,
    RegistrationStepNavComponent,
    RegistrationShellComponent,
    RegistrationStepperComponent,
    RegistrationLoginLinkComponent,
    RegistrationPasswordFieldsComponent,
    RegistrationNameFieldsComponent,
    RegistrationEmailFieldComponent,
    RegistrationPhoneFieldComponent,
    RegistrationLocationFieldsComponent,
    RegistrationReviewStepComponent,
  ],
  templateUrl: './registration-mentor.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationMentorPage
  extends BaseStepperRegistrationComponent
  implements OnInit
{
  private readonly store = inject(Store);
  private readonly toastService = inject(ToastService);

  readonly backToRole = output<void>();

  protected readonly isMentorRegisterLoading = this.store.selectSignal(
    AuthSelectors.isMentorRegisterLoading
  );

  protected readonly totalSteps = 5;
  protected readonly stepTitles = [
    'Personal Information',
    'Security',
    'Location',
    'Professional Details',
    'Review & Confirm',
  ];
  protected readonly stepDescriptions = [
    'Basic details & contact',
    'Set your password',
    'Country & timezone',
    'Share your expertise',
    'Review & accept terms',
  ];

  protected readonly registerForm: FormGroup;
  protected readonly expertiseOptions = expertiseOptions;
  protected selectedFiles: File[] = [];

  constructor() {
    super();

    const formConfig = createFormConfig('MENTOR_REGISTER');
    this.registerForm = this.fb.group(formConfig.fields, formConfig.options);

    this.setupFormAutoPopulation();

    watchRegistrationOutcome({
      successMessage: this.store.selectSignal(AuthSelectors.successMessage),
      errorMessage: this.store.selectSignal(AuthSelectors.errorMessage),
      confirmationRoute: APP_ROUTES.REGISTER_MENTOR_CONFIRMATION,
      store: this.store,
      toastService: this.toastService,
      router: this.router,
      onSuccess: () => this.handleSubmissionSuccess(),
      onError: (message) => this.handleSubmissionError(message),
    });
  }

  ngOnInit(): void {
    this.scrollToTop();
  }

  protected goBackToRoleSelection(): void {
    this.clearSubmissionError();
    this.backToRole.emit();
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
          !!form.get('password')?.valid &&
          !!form.get('confirmPassword')?.valid &&
          this.passwordsMatch()
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
    handleExpertiseChange(event, expertise, this.registerForm);
  }

  protected isExpertiseSelected(expertise: string): boolean {
    return isExpertiseSelected(expertise, this.registerForm);
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.handleSubmissionError(
          'File size exceeds 10MB limit. Please choose a smaller file.'
        );
        input.value = '';
        this.selectedFiles = [];
        return;
      }

      this.selectedFiles = [file];
      this.registerForm.patchValue({ files: this.selectedFiles });
    }
  }

  protected clearSelectedFiles(): void {
    this.selectedFiles = [];
    this.registerForm.patchValue({ files: [] });
  }

  protected async onSubmit(): Promise<void> {
    if (!this.preSubmissionValidation()) {
      return;
    }

    this.startSubmission();

    try {
      const formData = this.registerForm.value;
      const emailRedirectTo = buildVerifyEmailRedirectUrl();

      const registrationData: RegisterMentorRequest = {
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        suffix: formData.suffix || undefined,
        email: formData.email.toLowerCase().trim(),
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
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
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
    return getCountryDisplayName(value);
  }

  protected getLanguageLabel(value: string | null): string {
    if (!value) return 'English';
    return getLanguageDisplayName(value);
  }
}
