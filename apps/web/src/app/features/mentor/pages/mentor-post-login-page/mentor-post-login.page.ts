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
import { ProfileSetupOptionChipsComponent } from '../../../../shared/components/profile-setup/profile-setup-option-chips/profile-setup-option-chips.component';
import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { expertiseOptions } from '../../../../shared/helpers/expertise-selection.helper';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { isSessionExpiredError } from '../../../../shared/utils/http-error.util';
import {
  readFileAsDataUrl,
  validateAvatarFile,
} from '../../../../shared/utils/avatar-validation.util';
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
    ProfileSetupOptionChipsComponent,
  ],
  templateUrl: './mentor-post-login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorPostLoginPage {
  private static readonly MAX_SKILLS = 8;

  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly currentStep = signal(1);
  protected readonly totalSteps = 3;
  protected readonly isSubmitting = signal(false);
  protected readonly expertiseOptions = expertiseOptions;
  protected readonly currentUser = this.store.selectSignal(AuthSelectors.user);
  protected readonly avatarPreview = signal<string | null>(null);
  protected readonly avatarError = signal<string | null>(null);
  protected readonly maxSkills = MentorPostLoginPage.MAX_SKILLS;
  protected readonly stepTitles = ['About You', 'Topics & Skills', 'Availability'];
  protected readonly availability = signal<UserAvailabilityInterface[]>([]);

  protected selectedAvatarFile: File | null = null;

  protected readonly profileForm: FormGroup = this.fb.group({
    bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
    areasOfExpertise: this.fb.array([], Validators.required),
    skills: this.fb.array([createFormArrayTextControl(this.fb)], Validators.required),
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

  protected toggleExpertise(area: string): void {
    const index = this.areasOfExpertise.controls.findIndex(
      (control) => control.value === area
    );
    if (index >= 0) {
      this.areasOfExpertise.removeAt(index);
      return;
    }

    this.areasOfExpertise.push(this.fb.control(area));
  }

  protected isExpertiseSelected = (area: string): boolean => {
    return this.areasOfExpertise.controls.some((control) => control.value === area);
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
        return this.areasOfExpertise.length > 0 && this.skills.valid && this.skills.length > 0;
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
      areasOfExpertise: this.areasOfExpertise.value,
      skills: this.skills.value,
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
