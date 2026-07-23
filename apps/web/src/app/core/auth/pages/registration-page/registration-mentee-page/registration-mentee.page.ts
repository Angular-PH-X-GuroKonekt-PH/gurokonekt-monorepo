import { ChangeDetectionStrategy, Component, inject, OnInit, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { RegisterMenteeRequest } from '@gurokonekt/models/interfaces/auth/register-mentee-request.interface';
import { ToastService } from '../../../../../shared/services/toast.service';
import { BaseStepperRegistrationComponent } from 'apps/web/src/app/shared/base-form/base-stepper-registration.component';
import { createFormConfig } from 'apps/web/src/app/shared/constants';
import { formatPhoneToE164 } from 'apps/web/src/app/shared/utils/phone.util';
import { buildVerifyEmailRedirectUrl } from 'apps/web/src/app/shared/utils/email-verification.util';
import { APP_ROUTES } from 'apps/web/src/app/shared/constants/routes';
import { RegisterMentee } from '../../../store/auth.actions';
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
  selector: 'app-registration-mentee-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
  templateUrl: './registration-mentee.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationMenteePage
  extends BaseStepperRegistrationComponent
  implements OnInit
{
  private readonly store = inject(Store);
  private readonly toastService = inject(ToastService);

  readonly backToRole = output<void>();

  protected readonly isMenteeRegisterLoading = this.store.selectSignal(
    AuthSelectors.isMenteeRegisterLoading
  );

  protected readonly totalSteps = 4;
  protected readonly stepTitles = [
    'Personal Information',
    'Account Security',
    'Location & Language',
    'Confirmation',
  ];
  protected readonly stepDescriptions = [
    'Tell us about yourself',
    'Create a secure password',
    'Location & preferences',
    'Review and accept terms',
  ];

  protected readonly registerForm: FormGroup;

  constructor() {
    super();

    const formConfig = createFormConfig('MENTEE_REGISTER');
    this.registerForm = this.fb.group(formConfig.fields, formConfig.options);

    this.setupFormAutoPopulation();

    watchRegistrationOutcome({
      successMessage: this.store.selectSignal(AuthSelectors.successMessage),
      errorMessage: this.store.selectSignal(AuthSelectors.errorMessage),
      confirmationRoute: APP_ROUTES.REGISTER_MENTEE_CONFIRMATION,
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
      const email = formData.email.toLowerCase().trim();
      const emailRedirectTo = buildVerifyEmailRedirectUrl(email);

      const registrationData: RegisterMenteeRequest = {
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
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      };

      this.store.dispatch(new RegisterMentee(registrationData));
    } catch {
      this.handleSubmissionError(
        'An unexpected error occurred. Please try again.'
      );
    }
  }
}
