import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { MenteePreferredSessionType, DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';
import type { UpdateMenteeProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';
import type { DayAvailability, TimeFrame } from '../../../interfaces/post-login.interface';
import { ToastService } from '../../../services/toast.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { AuthState } from '../../../store/auth/auth.state';
import * as AuthActions from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-post-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './post-login.html',
  styleUrl: './post-login.scss',
})
export class PostLogin implements OnInit {
  private static readonly MAX_LEARNING_GOALS = 5;
  private static readonly MAX_AREAS_OF_INTEREST = 5;
  private static readonly MAX_TIME_FRAMES_PER_DAY = 3;
  private static readonly MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly currentStep = signal(1);
  protected readonly totalSteps = 3;
  protected readonly isSubmitting = signal(false);
  
  protected avatarPreview = signal<string | null>(null);
  protected selectedAvatarFile: File | null = null;
  protected avatarError = signal<string | null>(null);
  
  // Get current user from auth state
  protected readonly currentUser = this.store.selectSignal(AuthState.user);
  
  // Expose enums to template
  protected readonly MenteePreferredSessionType = MenteePreferredSessionType;
  protected readonly DaysInWeek = DaysInWeek;
  protected readonly daysOfWeek = Object.values(DaysInWeek);
  
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
  protected availabilitySchedule = signal<DayAvailability[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.initializeAvailability();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      learningGoals: this.fb.array([], Validators.required),
      areasOfInterest: this.fb.array([], Validators.required),
      preferredSessionType: [MenteePreferredSessionType.Online, Validators.required],
    });

    // Add initial learning goal field
    this.addLearningGoal();
  }

  private initializeAvailability(): void {
    const schedule: DayAvailability[] = this.daysOfWeek.map(day => ({
      day,
      enabled: false,
      timeFrames: [this.createDefaultTimeFrame()]
    }));
    this.availabilitySchedule.set(schedule);
  }

  private createDefaultTimeFrame(): TimeFrame {
    return { from: '09:00', to: '17:00' };
  }

  private updateScheduleForDay(day: DaysInWeek, update: (daySchedule: DayAvailability) => void): void {
    const schedule = this.availabilitySchedule();
    const dayIndex = schedule.findIndex(d => d.day === day);
    if (dayIndex < 0) return;

    update(schedule[dayIndex]);
    this.availabilitySchedule.set([...schedule]);
  }

  // Learning Goals Management
  get learningGoals(): FormArray {
    return this.profileForm.get('learningGoals') as FormArray;
  }

  addLearningGoal(): void {
    if (this.learningGoals.length < PostLogin.MAX_LEARNING_GOALS) {
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
      if (this.areasOfInterest.length < PostLogin.MAX_AREAS_OF_INTEREST) {
        this.areasOfInterest.push(this.fb.control(area));
      }
    }
  }

  isAreaSelected(area: string): boolean {
    return this.areasOfInterest.controls.some(control => control.value === area);
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
    return PostLogin.ALLOWED_AVATAR_TYPES.includes(file.type);
  }

  private isValidAvatarSize(file: File): boolean {
    return file.size <= PostLogin.MAX_AVATAR_SIZE_BYTES;
  }

  removeAvatar(): void {
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  // Availability Management
  toggleDay(day: DaysInWeek): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      daySchedule.enabled = !daySchedule.enabled;
    });
  }

  addTimeFrame(day: DaysInWeek): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      if (daySchedule.timeFrames.length < PostLogin.MAX_TIME_FRAMES_PER_DAY) {
        daySchedule.timeFrames.push(this.createDefaultTimeFrame());
      }
    });
  }

  removeTimeFrame(day: DaysInWeek, timeFrameIndex: number): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      if (daySchedule.timeFrames.length > 1) {
        daySchedule.timeFrames.splice(timeFrameIndex, 1);
      }
    });
  }

  updateTimeFrame(day: DaysInWeek, timeFrameIndex: number, field: 'from' | 'to', value: string): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      if (!daySchedule.timeFrames[timeFrameIndex]) return;
      daySchedule.timeFrames[timeFrameIndex][field] = value;
    });
  }

  getDaySchedule(day: DaysInWeek): DayAvailability | undefined {
    return this.availabilitySchedule().find(d => d.day === day);
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
               this.areasOfInterest.length > 0;
      case 3:
        return this.hasAtLeastOneAvailability();
      default:
        return false;
    }
  }

  private hasAtLeastOneAvailability(): boolean {
    return this.availabilitySchedule().some(day => day.enabled && day.timeFrames.length > 0);
  }

  private buildAvailabilityPayload(): Array<{ day: DaysInWeek; timeFrames: TimeFrame[] }> {
    return this.availabilitySchedule()
      .filter(day => day.enabled)
      .map(day => ({
        day: day.day,
        timeFrames: day.timeFrames,
      }));
  }

  private buildProfileData(): Partial<UpdateMenteeProfileInterface> {
    const availability = this.buildAvailabilityPayload();
    return {
      bio: this.profileForm.value.bio,
      learningGoals: this.learningGoals.value,
      areasOfInterest: this.areasOfInterest.value,
      preferredSessionType: this.profileForm.value.preferredSessionType,
      ...(availability.length > 0 && { availability }),
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
      this.router.navigate(['/login']);
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
      this.router.navigate(['/dashboard']);
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
