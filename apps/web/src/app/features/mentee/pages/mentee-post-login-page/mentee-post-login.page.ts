import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { MenteePreferredSessionType } from '@gurokonekt/models/interfaces/user/user.model';
import type { UpdateMenteeProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { AuthSelectors } from 'apps/web/src/app/core/auth/store/auth.selectors';

@Component({
  selector: 'mentee-post-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './mentee-post-login.page.html'
})
export class MenteePostLoginPage implements OnInit {
  private static readonly MAX_LEARNING_GOALS = 5;
  private static readonly MAX_AREAS_OF_INTEREST = 5;
  private static readonly MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly currentStep = signal(1);
  protected readonly totalSteps = 2;
  protected readonly isSubmitting = signal(false);
  
  protected avatarPreview = signal<string | null>(null);
  protected selectedAvatarFile: File | null = null;
  protected avatarError = signal<string | null>(null);
  
  // Get current user from auth state
  protected readonly currentUser = this.store.selectSignal(AuthSelectors.user);
  
  // Expose enums to template
  protected readonly MenteePreferredSessionType = MenteePreferredSessionType;

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

  protected profileForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      learningGoals: this.fb.array([], Validators.required),
      areasOfInterest: this.fb.array([], Validators.required),
      preferredSessionType: this.fb.array([], Validators.required),
    });

    // Add initial learning goal field
    this.addLearningGoal();
  }

  // Learning Goals Management
  get learningGoals(): FormArray {
    return this.profileForm.get('learningGoals') as FormArray;
  }

  addLearningGoal(): void {
    if (this.learningGoals.length < MenteePostLoginPage.MAX_LEARNING_GOALS) {
      this.learningGoals.push(this.fb.control('', [Validators.required, Validators.minLength(2)]));
    }
  }

  removeLearningGoal(index: number): void {
    if (this.learningGoals.length > 1) {
      this.learningGoals.removeAt(index);
    }
  }

  // Areas of Interest Management
  get areasOfInterest(): FormArray {
    return this.profileForm.get('areasOfInterest') as FormArray;
  }

  toggleAreaOfInterest(area: string): void {
    const index = this.areasOfInterest.controls.findIndex(
      control => control.value === area
    );

    if (index >= 0) {
      this.areasOfInterest.removeAt(index);
    } else {
      if (this.areasOfInterest.length < MenteePostLoginPage .MAX_AREAS_OF_INTEREST) {
        this.areasOfInterest.push(this.fb.control(area));
      }
    }
  }

  isAreaSelected(area: string): boolean {
    return this.areasOfInterest.controls.some(control => control.value === area);
  }

  // Preferred Session Type Management
  get preferredSessionTypes(): FormArray {
    return this.profileForm.get('preferredSessionType') as FormArray;
  }

  toggleSessionType(type: MenteePreferredSessionType): void {
    const index = this.preferredSessionTypes.controls.findIndex(
      control => control.value === type
    );

    if (index >= 0) {
      this.preferredSessionTypes.removeAt(index);
    } else {
      this.preferredSessionTypes.push(this.fb.control(type));
    }
  }

  isSessionTypeSelected(type: MenteePreferredSessionType): boolean {
    return this.preferredSessionTypes.controls.some(control => control.value === type);
  }

  // Avatar Management
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.avatarError.set(null);

    if (!this.isValidAvatarType(file)) {
      this.avatarError.set('Only JPG, JPEG, and PNG formats are allowed');
      return;
    }

    if (!this.isValidAvatarSize(file)) {
      this.avatarError.set('File size must be less than 5MB');
      return;
    }

    // Preview the image
    this.selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  private isValidAvatarType(file: File): boolean {
    return MenteePostLoginPage.ALLOWED_AVATAR_TYPES.includes(file.type);
  }

  private isValidAvatarSize(file: File): boolean {
    return file.size <= MenteePostLoginPage.MAX_AVATAR_SIZE_BYTES;
  }

  removeAvatar(): void {
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  // Step Navigation
  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(step => step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep()) {
      case 1:
        return (this.profileForm.get('bio')?.valid ?? false) && this.selectedAvatarFile !== null;
      case 2:
        return this.learningGoals.valid && 
               this.learningGoals.length > 0 &&
               this.areasOfInterest.length > 0 &&
               this.preferredSessionTypes.length > 0;
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

  // Form Submission
  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid || this.isSubmitting()) return;

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

      // Dispatch action to state - state handlers will manage the HTTP call and updates
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
      const message = (error as { message?: string })?.message;
      this.toastService.error(
        message || 'Failed to setup profile. Please try again.',
        'Error'
      );
      this.isSubmitting.set(false);
    }
  }
}
