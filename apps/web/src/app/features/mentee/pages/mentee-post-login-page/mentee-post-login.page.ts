import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom, merge } from 'rxjs';
import { MenteePreferredSessionType } from '@gurokonekt/models/interfaces/user/user.model';
import type { UpdateMenteeProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  FormArrayTextListComponent,
  createFormArrayTextControl,
} from '../../../../shared/components/form-array-text-list/form-array-text-list.component';
import { ProfileSetupShellComponent } from '../../../../shared/components/profile-setup/profile-setup-shell/profile-setup-shell.component';
import { ProfileSetupStepperComponent } from '../../../../shared/components/profile-setup/profile-setup-stepper/profile-setup-stepper.component';
import { ProfileSetupStepNavComponent } from '../../../../shared/components/profile-setup/profile-setup-step-nav/profile-setup-step-nav.component';
import { ProfileSetupAvatarComponent } from '../../../../shared/components/profile-setup/profile-setup-avatar/profile-setup-avatar.component';
import { ProfileSetupBioComponent } from '../../../../shared/components/profile-setup/profile-setup-bio/profile-setup-bio.component';
import { ProfileSetupOptionChipsComponent } from '../../../../shared/components/profile-setup/profile-setup-option-chips/profile-setup-option-chips.component';
import { ProfileSetupSessionTypeComponent } from '../../../../shared/components/profile-setup/profile-setup-session-type/profile-setup-session-type.component';
import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { isSessionExpiredError } from '../../../../shared/utils/http-error.util';
import {
  readFileAsDataUrl,
  validateAvatarFile,
} from '../../../../shared/utils/avatar-validation.util';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';

@Component({
  selector: 'mentee-post-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormArrayTextListComponent,
    ProfileSetupShellComponent,
    ProfileSetupStepperComponent,
    ProfileSetupStepNavComponent,
    ProfileSetupAvatarComponent,
    ProfileSetupBioComponent,
    ProfileSetupOptionChipsComponent,
    ProfileSetupSessionTypeComponent,
  ],
  templateUrl: './mentee-post-login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenteePostLoginPage {
  private static readonly MAX_LEARNING_GOALS = 5;
  private static readonly MAX_AREAS_OF_INTEREST = 5;

  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly currentStep = signal(1);
  protected readonly totalSteps = 2;
  protected readonly isSubmitting = signal(false);
  protected readonly avatarPreview = signal<string | null>(null);
  protected readonly avatarError = signal<string | null>(null);
  protected readonly currentUser = this.store.selectSignal(AuthSelectors.user);

  protected readonly stepTitles = ['Basic Info', 'Interests & Goals'];
  protected readonly areasOfInterestOptions = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'DevOps',
    'Cloud Computing',
    'Cybersecurity',
    'UI/UX Design',
    'Project Management',
    'Business Strategy',
    'Digital Marketing',
    'Career Development',
  ];
  protected readonly maxLearningGoals = MenteePostLoginPage.MAX_LEARNING_GOALS;
  protected readonly maxAreasOfInterest =
    MenteePostLoginPage.MAX_AREAS_OF_INTEREST;

  protected selectedAvatarFile: File | null = null;

  protected readonly profileForm: FormGroup = this.fb.group({
    bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
    learningGoals: this.fb.array([createFormArrayTextControl(this.fb)], Validators.required),
    areasOfInterest: this.fb.array([], Validators.required),
    preferredSessionType: this.fb.array([], Validators.required),
  });

  /**
   * Reactive mirror of the form's value/status so OnPush re-evaluates step
   * validity as the user edits. `toSignal` handles teardown automatically.
   */
  private readonly formState = toSignal(
    merge(this.profileForm.valueChanges, this.profileForm.statusChanges)
  );

  get learningGoals(): FormArray {
    return this.profileForm.get('learningGoals') as FormArray;
  }

  get areasOfInterest(): FormArray {
    return this.profileForm.get('areasOfInterest') as FormArray;
  }

  get preferredSessionTypes(): FormArray {
    return this.profileForm.get('preferredSessionType') as FormArray;
  }

  protected toggleAreaOfInterest(area: string): void {
    const index = this.areasOfInterest.controls.findIndex(
      (control) => control.value === area
    );

    if (index >= 0) {
      this.areasOfInterest.removeAt(index);
      return;
    }

    if (this.areasOfInterest.length < MenteePostLoginPage.MAX_AREAS_OF_INTEREST) {
      this.areasOfInterest.push(this.fb.control(area));
    }
  }

  protected isAreaSelected = (area: string): boolean => {
    return this.areasOfInterest.controls.some((control) => control.value === area);
  };

  protected toggleSessionType(type: MenteePreferredSessionType): void {
    const index = this.preferredSessionTypes.controls.findIndex(
      (control) => control.value === type
    );

    if (index >= 0) {
      this.preferredSessionTypes.removeAt(index);
      return;
    }

    this.preferredSessionTypes.push(this.fb.control(type));
  }

  protected isSessionTypeSelected = (type: MenteePreferredSessionType): boolean => {
    return this.preferredSessionTypes.controls.some(
      (control) => control.value === type
    );
  };

  protected async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.avatarError.set(null);

    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      this.avatarError.set(validation.error);
      input.value = '';
      return;
    }

    this.selectedAvatarFile = file;
    try {
      this.avatarPreview.set(await readFileAsDataUrl(file));
    } catch {
      this.avatarError.set('Failed to preview image');
      this.selectedAvatarFile = null;
    }
    input.value = '';
  }

  protected removeAvatar(input?: HTMLInputElement): void {
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.avatarError.set(null);
    if (input) {
      input.value = '';
    }
  }

  protected nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((step) => step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected canProceedToNextStep(): boolean {
    this.formState();

    switch (this.currentStep()) {
      case 1:
        return (this.profileForm.get('bio')?.valid ?? false) && this.selectedAvatarFile !== null;
      case 2:
        return (
          this.learningGoals.valid &&
          this.learningGoals.length > 0 &&
          this.areasOfInterest.length > 0 &&
          this.preferredSessionTypes.length > 0
        );
      default:
        return false;
    }
  }

  private buildProfileData(): Partial<UpdateMenteeProfileInterface> {
    return {
      bio: this.profileForm.value.bio,
      learningGoals: this.learningGoals.value,
      areasOfInterest: this.areasOfInterest.value,
      preferredSessionType: this.preferredSessionTypes.value,
    };
  }

  private validateSubmissionPrerequisites(): boolean {
    if (!this.selectedAvatarFile) {
      this.toastService.error('Profile picture is required');
      this.currentStep.set(1);
      return false;
    }

    return true;
  }

  protected async onSubmit(): Promise<void> {
    if (this.currentStep() !== this.totalSteps || this.profileForm.invalid || this.isSubmitting()) {
      return;
    }

    if (!this.validateSubmissionPrerequisites()) {
      return;
    }

    const user = this.currentUser();
    if (!user) {
      this.toastService.error('User session not found. Please login again.');
      this.router.navigate([APP_ROUTES.LOGIN]);
      return;
    }

    this.isSubmitting.set(true);

    try {
      const profileData = this.buildProfileData();

      await firstValueFrom(
        this.store.dispatch(
          new AuthActions.UpdateMenteeProfile({
            userId: user.id,
            profileData,
            avatarFile: this.selectedAvatarFile as File,
          })
        )
      );

      this.toastService.success('Profile setup completed successfully!', 'Welcome!');
      this.router.navigate([APP_ROUTES.DASHBOARD]);
    } catch (error) {
      if (isSessionExpiredError(error)) {
        this.isSubmitting.set(false);
        return;
      }

      const message = (error as { message?: string })?.message;
      this.toastService.error(
        message || 'Failed to setup profile. Please try again.',
        'Error'
      );
      this.isSubmitting.set(false);
    }
  }
}
