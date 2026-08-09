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
import type {
  UpdateMentorProfileInterface,
  UserAvailabilityInterface,
} from '@gurokonekt/models/interfaces/user/user.model';

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
import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { EXPERTISE_OPTIONS } from '../../../../shared/constants/expertise.constants';
import { isSessionExpiredError } from '../../../../shared/utils/http-error.util';
import type { AvatarCropResult } from '../../../../shared/components/avatar-crop-modal/avatar-crop-modal.component';
import { AuthSelectors } from '../../../../core/auth/store/auth.selectors';
import { MentorWeeklyAvailability } from './mentor-weekly-availability/mentor-weekly-availability';

@Component({
  selector: 'app-mentor-post-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormArrayTextListComponent,
    MentorWeeklyAvailability,
    ProfileSetupShellComponent,
    ProfileSetupStepperComponent,
    ProfileSetupStepNavComponent,
    ProfileSetupAvatarComponent,
    ProfileSetupBioComponent,
  ],
  templateUrl: './mentor-post-login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorPostLoginPage {
  private static readonly MAX_SKILLS = 8;
  private static readonly MAX_AREAS_OF_EXPERTISE = 10;

  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly currentStep = signal(1);
  protected readonly totalSteps = 3;
  protected readonly isSubmitting = signal(false);
  protected readonly currentUser = this.store.selectSignal(AuthSelectors.user);
  protected readonly avatarPreview = signal<string | null>(null);
  protected readonly avatarError = signal<string | null>(null);
  protected readonly maxSkills = MentorPostLoginPage.MAX_SKILLS;
  protected readonly maxAreasOfExpertise = MentorPostLoginPage.MAX_AREAS_OF_EXPERTISE;
  protected readonly expertiseSuggestions = EXPERTISE_OPTIONS;
  protected readonly stepTitles = ['About You', 'Topics & Skills', 'Availability'];
  protected readonly availability = signal<UserAvailabilityInterface[]>([]);

  protected selectedAvatarFile: File | null = null;

  protected readonly profileForm: FormGroup = this.fb.group({
    bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
    areasOfExpertise: this.fb.array(
      [createFormArrayTextControl(this.fb)],
      Validators.required
    ),
    skills: this.fb.array([createFormArrayTextControl(this.fb, 2, false)]),
  });

  /**
   * Reactive mirror of the form's value/status so OnPush re-evaluates step
   * validity as the user edits. `toSignal` handles teardown automatically.
   */
  private readonly formState = toSignal(
    merge(this.profileForm.valueChanges, this.profileForm.statusChanges)
  );

  get areasOfExpertise(): FormArray {
    return this.profileForm.get('areasOfExpertise') as FormArray;
  }

  get skills(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }

  protected onAvatarReady(result: AvatarCropResult): void {
    if (this.avatarPreview()?.startsWith('blob:')) {
      URL.revokeObjectURL(this.avatarPreview()!);
    }

    this.selectedAvatarFile = result.file;
    this.avatarPreview.set(result.previewUrl);
    this.avatarError.set(null);
  }

  protected removeAvatar(input?: HTMLInputElement): void {
    if (this.avatarPreview()?.startsWith('blob:')) {
      URL.revokeObjectURL(this.avatarPreview()!);
    }
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
          this.areasOfExpertise.valid &&
          this.areasOfExpertise.length > 0 &&
          this.skills.valid
        );
      case 3:
        return this.hasAtLeastOneAvailability();
      default:
        return false;
    }
  }

  private hasAtLeastOneAvailability(): boolean {
    return this.availability().some((day) => day.timeFrames.length > 0);
  }

  private buildProfileData(): Partial<UpdateMentorProfileInterface> {
    return {
      bio: this.profileForm.value.bio,
      areasOfExpertise: (this.areasOfExpertise.value as string[])
        .map((area) => area.trim())
        .filter((area) => area.length > 0),
      skills: (this.skills.value as string[])
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0),
      availability: this.availability(),
    };
  }

  private validateSubmissionPrerequisites(): boolean {
    if (!this.selectedAvatarFile) {
      this.toastService.error('Profile picture is required');
      this.currentStep.set(1);
      return false;
    }

    if (!this.hasAtLeastOneAvailability()) {
      this.toastService.error('Please set at least one availability slot');
      this.currentStep.set(3);
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
          new AuthActions.UpdateMentorProfile({
            userId: user.id,
            profileData,
            avatarFile: this.selectedAvatarFile ?? undefined,
          })
        )
      );

      this.toastService.success('Mentor profile setup completed successfully!', 'Welcome!');
      await this.router.navigate([APP_ROUTES.DASHBOARD]);
    } catch (error) {
      if (isSessionExpiredError(error)) {
        this.isSubmitting.set(false);
        return;
      }

      const message = (error as { message?: string })?.message;
      this.toastService.error(
        message || 'Failed to setup mentor profile. Please try again.',
        'Error'
      );
      this.isSubmitting.set(false);
    }
  }
}
