import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import type {
  UpdateMentorProfileInterface,
  UserAvailabilityInterface,
} from '@gurokonekt/models/interfaces/user/user.model';

import { ToastService } from '../../../../shared/services/toast.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { FormArrayTextListComponent, createFormArrayTextControl } from '../../../../shared/components/form-array-text-list/form-array-text-list.component';
import { AuthState } from '../../../../core/auth/store/auth.state';
import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { expertiseOptions } from 'apps/web/src/app/shared/helpers/expertise-selection.helper';
import { APP_ROUTES } from 'apps/web/src/app/shared/constants/routes';
import { isSessionExpiredError } from '../../../../shared/utils/http-error.util';
import { AuthSelectors } from 'apps/web/src/app/core/auth/store/auth.selectors';
import { MentorWeeklyAvailability } from './mentor-weekly-availability/mentor-weekly-availability';

@Component({
  selector: 'app-mentor-post-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    FormArrayTextListComponent,
    MentorWeeklyAvailability,
  ],
  templateUrl: './mentor-post-login.page.html',
})
export class MentorPostLoginPage implements OnInit {
  private static readonly MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
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

  protected selectedAvatarFile: File | null = null;
  protected profileForm!: FormGroup;
  protected readonly availability = signal<UserAvailabilityInterface[]>([]);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      areasOfExpertise: this.fb.array([], Validators.required),
      skills: this.fb.array([createFormArrayTextControl(this.fb)], Validators.required),
    });
  }

  get areasOfExpertise(): FormArray {
    return this.profileForm.get('areasOfExpertise') as FormArray;
  }

  get skills(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }

  toggleExpertise(area: string): void {
    const index = this.areasOfExpertise.controls.findIndex((control) => control.value === area);
    if (index >= 0) {
      this.areasOfExpertise.removeAt(index);
      return;
    }

    this.areasOfExpertise.push(this.fb.control(area));
  }

  isExpertiseSelected(area: string): boolean {
    return this.areasOfExpertise.controls.some((control) => control.value === area);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.avatarError.set(null);

    if (!MentorPostLoginPage.ALLOWED_AVATAR_TYPES.includes(file.type)) {
      this.avatarError.set('Only JPG, JPEG, and PNG formats are allowed');
      input.value = '';
      return;
    }

    if (file.size > MentorPostLoginPage.MAX_AVATAR_SIZE_BYTES) {
      this.avatarError.set('File size must be less than 5MB');
      input.value = '';
      return;
    }

    this.selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      this.avatarPreview.set(loadEvent.target?.result as string);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(input?: HTMLInputElement): void {
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.avatarError.set(null);
    if (input) {
      input.value = '';
    }
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((step) => step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  canProceedToNextStep(): boolean {
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

  async onSubmit(): Promise<void> {
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
      this.toastService.error(message || 'Failed to setup mentor profile. Please try again.', 'Error');
      this.isSubmitting.set(false);
    }
  }
}
