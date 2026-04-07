import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { MenteePreferredSessionType, DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';
import type { UpdateMenteeProfileInterface, MenteeProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';
import type { DayAvailability, TimeFrame } from '../../../interfaces/post-login.interface';
import { ToastService } from '../../../services/toast.service';
import { ProfileService } from '../../../services/profile.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { AuthState } from '../../../store/auth/auth.state';
import * as AuthActions from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettingsComponent implements OnInit {
  private static readonly MAX_LEARNING_GOALS = 5;
  private static readonly MAX_AREAS_OF_INTEREST = 5;
  private static readonly MAX_TIME_FRAMES_PER_DAY = 3;
  private static readonly MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  private static readonly MAX_LEARNING_GOAL_LENGTH = 500;

  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly isSubmitting = signal(false);
  protected readonly isLoading = signal(true);
  
  protected avatarPreview = signal<string | null>(null);
  protected currentAvatarUrl = signal<string | null>(null);
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

  protected readonly countryOptions = [
    'Philippines',
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'India',
    'Singapore',
    'Japan',
    'Germany',
    'France',
    'Other',
  ];

  protected readonly timezoneOptions = [
    'UTC-12:00',
    'UTC-11:00',
    'UTC-10:00',
    'UTC-09:00',
    'UTC-08:00',
    'UTC-07:00',
    'UTC-06:00',
    'UTC-05:00',
    'UTC-04:00',
    'UTC-03:00',
    'UTC-02:00',
    'UTC-01:00',
    'UTC+00:00',
    'UTC+01:00',
    'UTC+02:00',
    'UTC+03:00',
    'UTC+04:00',
    'UTC+05:00',
    'UTC+05:30',
    'UTC+06:00',
    'UTC+07:00',
    'UTC+08:00',
    'UTC+09:00',
    'UTC+10:00',
    'UTC+11:00',
    'UTC+12:00',
  ];

  protected readonly languageOptions = [
    'English',
    'Filipino',
    'Spanish',
    'Mandarin',
    'Japanese',
    'German',
    'French',
    'Hindi',
    'Portuguese',
    'Korean',
  ];

  protected profileForm!: FormGroup;
  protected availabilitySchedule = signal<DayAvailability[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.initializeAvailability();
    this.loadProfileData();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      bio: ['', [Validators.minLength(50), Validators.maxLength(500)]],
      phoneNumber: ['', [Validators.pattern(/^\+\d{10,15}$/)]],
      country: ['', Validators.required],
      timezone: ['', Validators.required],
      language: ['', Validators.required],
      learningGoals: this.fb.array([]),
      areasOfInterest: this.fb.array([], Validators.required),
      preferredSessionType: [MenteePreferredSessionType.Online, Validators.required],
    });
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

  private async loadProfileData(): Promise<void> {
    try {
      const user = this.currentUser();
      if (!user) {
        this.toastService.error('User session not found');
        return;
      }

      // Get current profile data
      const profileResponse = await firstValueFrom(
        this.profileService.getMenteeProfile(user.id)
      );

      if (profileResponse.data) {
        this.populateForm(profileResponse.data);
        // Get avatar URL from response data
        const avatarUrl = (profileResponse.data as any)?.avatarAttachments?.[0]?.publicUrl || 
                         (profileResponse.data as any)?.user?.avatarAttachments?.[0]?.publicUrl;
        if (avatarUrl) {
          this.currentAvatarUrl.set(avatarUrl);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.toastService.error('Failed to load profile data');
    } finally {
      this.isLoading.set(false);
    }
  }

  private populateForm(profileData: any): void {
    // Extract fields from profile data or nested user object
    const bio = profileData.bio || '';
    const phoneNumber = profileData.phoneNumber || profileData.user?.phoneNumber || '';
    const country = profileData.country || profileData.user?.country || '';
    const timezone = profileData.timezone || profileData.user?.timezone || '';
    const language = profileData.language || profileData.user?.language || '';
    const learningGoals = profileData.learningGoals || [];
    const areasOfInterest = profileData.areasOfInterest || [];
    const preferredSessionType = profileData.preferredSessionType || MenteePreferredSessionType.Online;
    const availability = profileData.availability || [];

    this.profileForm.patchValue({
      bio,
      phoneNumber,
      country,
      timezone,
      language,
      preferredSessionType,
    });

    // Populate learning goals
    if (learningGoals && Array.isArray(learningGoals)) {
      learningGoals.forEach(goal => {
        this.learningGoals.push(this.fb.control(goal, [Validators.maxLength(ProfileSettingsComponent.MAX_LEARNING_GOAL_LENGTH)]));
      });
    }

    // Populate areas of interest
    if (areasOfInterest && Array.isArray(areasOfInterest)) {
      areasOfInterest.forEach(area => {
        this.areasOfInterest.push(this.fb.control(area));
      });
    }

    // Populate availability
    if (availability && Array.isArray(availability)) {
      this.populateAvailabilitySchedule(availability);
    }
  }

  private populateAvailabilitySchedule(availability: Array<{ day: DaysInWeek; timeFrames: TimeFrame[] }>): void {
    const schedule = this.availabilitySchedule();
    availability.forEach(slot => {
      const daySchedule = schedule.find(d => d.day === slot.day);
      if (daySchedule) {
        daySchedule.enabled = true;
        daySchedule.timeFrames = slot.timeFrames || [this.createDefaultTimeFrame()];
      }
    });
    this.availabilitySchedule.set([...schedule]);
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
    if (this.learningGoals.length < ProfileSettingsComponent.MAX_LEARNING_GOALS) {
      this.learningGoals.push(this.fb.control('', [Validators.maxLength(ProfileSettingsComponent.MAX_LEARNING_GOAL_LENGTH)]));
    }
  }

  removeLearningGoal(index: number): void {
    if (this.learningGoals.length > 0) {
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
      if (this.areasOfInterest.length < ProfileSettingsComponent.MAX_AREAS_OF_INTEREST) {
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
    return ProfileSettingsComponent.ALLOWED_AVATAR_TYPES.includes(file.type);
  }

  private isValidAvatarSize(file: File): boolean {
    return file.size <= ProfileSettingsComponent.MAX_AVATAR_SIZE_BYTES;
  }

  removeAvatarPreview(): void {
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  removeCurrentAvatar(): void {
    this.currentAvatarUrl.set(null);
  }

  // Availability Management
  toggleDay(day: DaysInWeek): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      daySchedule.enabled = !daySchedule.enabled;
    });
  }

  addTimeFrame(day: DaysInWeek): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      if (daySchedule.timeFrames.length < ProfileSettingsComponent.MAX_TIME_FRAMES_PER_DAY) {
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
      phoneNumber: this.profileForm.value.phoneNumber,
      country: this.profileForm.value.country,
      timezone: this.profileForm.value.timezone,
      language: this.profileForm.value.language,
      learningGoals: this.learningGoals.value.filter((g: string) => g.trim()),
      areasOfInterest: this.areasOfInterest.value,
      preferredSessionType: this.profileForm.value.preferredSessionType,
      ...(availability.length > 0 && { availability }),
    };
  }

  // Form Submission
  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid || this.isSubmitting()) return;

    if (this.areasOfInterest.length === 0) {
      this.toastService.error('Please select at least one area of interest');
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

      // Dispatch action to state
      await firstValueFrom(
        this.store.dispatch(
          new AuthActions.UpdateMenteeProfile({
            userId: user.id,
            profileData,
            avatarFile: this.selectedAvatarFile || undefined,
          })
        )
      );

      this.toastService.success('Profile updated successfully!');
      this.selectedAvatarFile = null;
      this.avatarPreview.set(null);
    } catch (error) {
      const message = (error as { message?: string })?.message;
      this.toastService.error(
        message || 'Failed to update profile. Please try again.',
        'Error'
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
