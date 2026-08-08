import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { merge } from 'rxjs';
import { RegisterMentorRequest } from '@gurokonekt/models/interfaces/auth/register-mentor-request.interface';
import { RegisterMentor } from '../../../store/auth.actions';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { BaseStepperRegistrationComponent } from '../../../../../shared/base-form/base-stepper-registration.component';
import { ToastService } from '../../../../../shared/services/toast.service';
import {
  createFormConfig,
  FORM_FIELD_VALIDATORS,
  VALIDATION_CONSTRAINTS,
  EXPERTISE_OPTIONS,
} from 'apps/web/src/app/shared/constants';
import { getCountryDisplayName, getLanguageDisplayName } from 'apps/web/src/app/shared/utils';
import { formatPhoneToE164 } from 'apps/web/src/app/shared/utils/phone.util';
import { APP_ROUTES } from 'apps/web/src/app/shared/constants/routes';
import { buildVerifyEmailRedirectUrl } from 'apps/web/src/app/shared/utils/email-verification.util';
import {
  ALLOWED_DOCUMENT_ACCEPT,
  validateDocumentFile,
} from 'apps/web/src/app/shared/utils/document-validation.util';
import {
  FormArrayTextListComponent,
  createFormArrayTextControl,
} from '../../../../../shared/components/form-array-text-list/form-array-text-list.component';
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
    FormArrayTextListComponent,
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

  protected readonly registerForm = this.buildRegisterForm();
  protected readonly maxAreasOfExpertise = VALIDATION_CONSTRAINTS.MAX_EXPERTISE_AREAS;
  protected readonly expertiseSuggestions = EXPERTISE_OPTIONS;
  protected readonly allowedDocumentAccept = ALLOWED_DOCUMENT_ACCEPT;
  private static readonly MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
  protected selectedFiles: File[] = [];
  protected readonly verificationFileError = signal<string | null>(null);

  /** Keeps OnPush step validity in sync with free-text FormArray edits. */
  private readonly formState = toSignal(
    merge(this.registerForm.valueChanges, this.registerForm.statusChanges),
    { initialValue: null }
  );

  constructor() {
    super();

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

  private buildRegisterForm(): FormGroup {
    const formConfig = createFormConfig('MENTOR_REGISTER');
    const form = this.fb.group(formConfig.fields, formConfig.options);
    form.setControl(
      'areasOfExpertise',
      this.fb.array(
        [createFormArrayTextControl(this.fb)],
        [...FORM_FIELD_VALIDATORS.EXPERTISE_AREAS]
      )
    );
    return form;
  }

  ngOnInit(): void {
    this.scrollToTop();
  }

  get areasOfExpertise(): FormArray {
    return this.registerForm.get('areasOfExpertise') as FormArray;
  }

  protected goBackToRoleSelection(): void {
    this.clearSubmissionError();
    this.backToRole.emit();
  }

  protected override isCurrentStepValid(): boolean {
    this.formState();
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
          this.areasOfExpertise.valid &&
          this.areasOfExpertise.length > 0 &&
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

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const validation = validateDocumentFile(
      file,
      RegistrationMentorPage.MAX_DOCUMENT_SIZE_BYTES
    );

    if (!validation.valid) {
      this.verificationFileError.set(validation.error);
      this.selectedFiles = [];
      this.registerForm.patchValue({ files: [] });
      input.value = '';
      return;
    }

    this.verificationFileError.set(null);
    this.clearSubmissionError();
    this.selectedFiles = [file];
    this.registerForm.patchValue({ files: this.selectedFiles });
  }

  protected clearSelectedFiles(): void {
    this.selectedFiles = [];
    this.verificationFileError.set(null);
    this.registerForm.patchValue({ files: [] });
  }

  protected async onSubmit(): Promise<void> {
    if (!this.preSubmissionValidation()) {
      return;
    }

    this.startSubmission();

    try {
      const formData = this.registerForm.value;
      const email = formData.email.toLowerCase().trim();
      const emailRedirectTo = buildVerifyEmailRedirectUrl(email);

      const registrationData: RegisterMentorRequest = {
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        suffix: formData.suffix || undefined,
        email,
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
        areasOfExpertise: (this.areasOfExpertise.value as string[])
          .map((area) => area.trim())
          .filter((area) => area.length > 0),
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
