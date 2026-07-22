import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import {
  MenteePreferredSessionType,
  DaysInWeek,
  UserRole,
} from '@gurokonekt/models/interfaces/user/user.model';
import type {
  UpdateMenteeProfileInterface,
  UpdateMentorProfileInterface,
} from '@gurokonekt/models/interfaces/user/user.model';
import type { DayAvailability, TimeFrame } from '../../../../shared/interfaces/post-login.interface';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProfileService } from '../../profile.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import * as AuthActions from '../../../../core/auth/store/auth.actions';
import { APP_ROUTES } from '../../../../shared/constants/routes';
import { AuthSelectors } from '../../../auth/store/auth.selectors';
import {
  getCountries,
  getLanguages,
  getTimezones,
} from '../../../../shared/utils/location-data.util';
import { resolveAvatarPublicUrl } from '../../../../shared/utils/avatar-url.util';
import { expertiseOptions } from '../../../../shared/helpers/expertise-selection.helper';

@Component({
  selector: 'app-profile-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './profile-settings.page.html',
})
export class ProfileSettingsPageComponent implements OnInit {
  private static readonly MAX_LEARNING_GOALS = 5;
  private static readonly MAX_AREAS_OF_INTEREST = 5;
  private static readonly MAX_AREAS_OF_EXPERTISE = 10;
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

  protected readonly currentUser = this.store.selectSignal(AuthSelectors.user);
  protected readonly isMentor = computed(
    () => this.currentUser()?.role === UserRole.Mentor
  );

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

  protected readonly expertiseOptions = expertiseOptions;
  protected readonly countryOptions = getCountries();
  protected readonly timezoneOptions = getTimezones();
  protected readonly languageOptions = getLanguages();

  protected profileForm!: FormGroup;
  protected availabilitySchedule = signal<DayAvailability[]>([]);

  /** Preserved on load so mentor updates do not wipe skills set during setup. */
  private mentorSkills: string[] = [];

  ngOnInit(): void {
    this.initializeForm();
    this.initializeAvailability();
    this.loadProfileData();
  }

  private initializeForm(): void {
    const mentor = this.isMentor();

    this.profileForm = this.fb.group({
      bio: ['', [Validators.minLength(50), Validators.maxLength(500)]],
      phoneNumber: ['', [Validators.pattern(/^\+\d{10,15}$/)]],
      country: ['', Validators.required],
      timezone: ['', Validators.required],
      language: ['', Validators.required],
      yearsOfExperience: [
        null as number | null,
        mentor ? [Validators.required, Validators.min(1), Validators.max(60)] : [],
      ],
      learningGoals: this.fb.array([]),
      areasOfInterest: this.fb.array([], mentor ? [] : [Validators.required]),
      areasOfExpertise: this.fb.array([], mentor ? [Validators.required] : []),
      preferredSessionType: this.fb.array([], mentor ? [] : [Validators.required]),
    });
  }

  private initializeAvailability(): void {
    const schedule: DayAvailability[] = this.daysOfWeek.map((day) => ({
      day,
      enabled: false,
      timeFrames: [this.createDefaultTimeFrame()],
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

      const profileResponse = await firstValueFrom(
        this.profileService.getUserProfile(user.id)
      );

      if (profileResponse.data) {
        const profileData = profileResponse.data as Record<string, unknown>;
        this.populateForm(profileData);
        const avatarUrl = resolveAvatarPublicUrl(profileData, '');
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

  private populateForm(profileData: Record<string, unknown>): void {
    const menteeProfile =
      (profileData['menteeProfile'] as Record<string, unknown> | undefined) ?? {};
    const mentorProfile =
      (profileData['mentorProfile'] as Record<string, unknown> | undefined) ?? {};
    const roleProfile = this.isMentor() ? mentorProfile : menteeProfile;

    const bio = (roleProfile['bio'] as string) || '';
    const phoneNumber =
      (profileData['phoneNumber'] as string) ||
      ((profileData['user'] as Record<string, unknown> | undefined)?.['phoneNumber'] as string) ||
      '';
    const country =
      (profileData['country'] as string) ||
      ((profileData['user'] as Record<string, unknown> | undefined)?.['country'] as string) ||
      '';
    const timezone =
      (profileData['timezone'] as string) ||
      ((profileData['user'] as Record<string, unknown> | undefined)?.['timezone'] as string) ||
      '';
    const language =
      (profileData['language'] as string) ||
      ((profileData['user'] as Record<string, unknown> | undefined)?.['language'] as string) ||
      '';

    this.profileForm.patchValue({
      bio,
      phoneNumber,
      country,
      timezone,
      language,
    });

    if (this.isMentor()) {
      this.populateMentorFields(mentorProfile);
    } else {
      this.populateMenteeFields(menteeProfile);
    }
  }

  private populateMentorFields(mentorProfile: Record<string, unknown>): void {
    const yearsOfExperience = mentorProfile['yearsOfExperience'];
    this.profileForm.patchValue({
      yearsOfExperience:
        typeof yearsOfExperience === 'number' ? yearsOfExperience : null,
    });

    this.mentorSkills = Array.isArray(mentorProfile['skills'])
      ? (mentorProfile['skills'] as string[])
      : [];

    const areasOfExpertise = Array.isArray(mentorProfile['areasOfExpertise'])
      ? (mentorProfile['areasOfExpertise'] as string[])
      : [];
    this.areasOfExpertise.clear();
    areasOfExpertise.forEach((area) => {
      this.areasOfExpertise.push(this.fb.control(area));
    });

    const availability = Array.isArray(mentorProfile['availability'])
      ? (mentorProfile['availability'] as Array<{ day: DaysInWeek; timeFrames: TimeFrame[] }>)
      : [];
    if (availability.length > 0) {
      this.populateAvailabilitySchedule(availability);
    }
  }

  private populateMenteeFields(menteeProfile: Record<string, unknown>): void {
    const preferredSessionType = Array.isArray(menteeProfile['preferredSessionType'])
      ? (menteeProfile['preferredSessionType'] as MenteePreferredSessionType[])
      : menteeProfile['preferredSessionType']
        ? [menteeProfile['preferredSessionType'] as MenteePreferredSessionType]
        : [];

    this.preferredSessionTypes.clear();
    preferredSessionType.forEach((type) => {
      this.preferredSessionTypes.push(this.fb.control(type));
    });

    const learningGoals = Array.isArray(menteeProfile['learningGoals'])
      ? (menteeProfile['learningGoals'] as string[])
      : [];
    learningGoals.forEach((goal) => {
      this.learningGoals.push(
        this.fb.control(goal, [
          Validators.maxLength(ProfileSettingsPageComponent.MAX_LEARNING_GOAL_LENGTH),
        ])
      );
    });

    const areasOfInterest = Array.isArray(menteeProfile['areasOfInterest'])
      ? (menteeProfile['areasOfInterest'] as string[])
      : [];
    areasOfInterest.forEach((area) => {
      this.areasOfInterest.push(this.fb.control(area));
    });
  }

  private populateAvailabilitySchedule(
    availability: Array<{ day: DaysInWeek; timeFrames: TimeFrame[] }>
  ): void {
    const schedule = this.availabilitySchedule();
    availability.forEach((slot) => {
      const daySchedule = schedule.find((d) => d.day === slot.day);
      if (daySchedule) {
        daySchedule.enabled = true;
        daySchedule.timeFrames = slot.timeFrames || [this.createDefaultTimeFrame()];
      }
    });
    this.availabilitySchedule.set([...schedule]);
  }

  private updateScheduleForDay(
    day: DaysInWeek,
    update: (daySchedule: DayAvailability) => void
  ): void {
    const schedule = this.availabilitySchedule();
    const dayIndex = schedule.findIndex((d) => d.day === day);
    if (dayIndex < 0) return;

    update(schedule[dayIndex]);
    this.availabilitySchedule.set([...schedule]);
  }

  get learningGoals(): FormArray {
    return this.profileForm.get('learningGoals') as FormArray;
  }

  addLearningGoal(): void {
    if (this.learningGoals.length < ProfileSettingsPageComponent.MAX_LEARNING_GOALS) {
      this.learningGoals.push(
        this.fb.control('', [
          Validators.maxLength(ProfileSettingsPageComponent.MAX_LEARNING_GOAL_LENGTH),
        ])
      );
    }
  }

  removeLearningGoal(index: number): void {
    if (this.learningGoals.length > 0) {
      this.learningGoals.removeAt(index);
    }
  }

  get areasOfInterest(): FormArray {
    return this.profileForm.get('areasOfInterest') as FormArray;
  }

  get areasOfExpertise(): FormArray {
    return this.profileForm.get('areasOfExpertise') as FormArray;
  }

  toggleAreaOfInterest(area: string): void {
    const index = this.areasOfInterest.controls.findIndex(
      (control) => control.value === area
    );

    if (index >= 0) {
      this.areasOfInterest.removeAt(index);
    } else if (
      this.areasOfInterest.length < ProfileSettingsPageComponent.MAX_AREAS_OF_INTEREST
    ) {
      this.areasOfInterest.push(this.fb.control(area));
    }
  }

  isAreaSelected(area: string): boolean {
    return this.areasOfInterest.controls.some((control) => control.value === area);
  }

  toggleAreaOfExpertise(area: string): void {
    const index = this.areasOfExpertise.controls.findIndex(
      (control) => control.value === area
    );

    if (index >= 0) {
      this.areasOfExpertise.removeAt(index);
    } else if (
      this.areasOfExpertise.length < ProfileSettingsPageComponent.MAX_AREAS_OF_EXPERTISE
    ) {
      this.areasOfExpertise.push(this.fb.control(area));
    }
  }

  isExpertiseSelected(area: string): boolean {
    return this.areasOfExpertise.controls.some((control) => control.value === area);
  }

  get preferredSessionTypes(): FormArray {
    return this.profileForm.get('preferredSessionType') as FormArray;
  }

  toggleSessionType(type: MenteePreferredSessionType): void {
    const index = this.preferredSessionTypes.controls.findIndex(
      (control) => control.value === type
    );

    if (index >= 0) {
      this.preferredSessionTypes.removeAt(index);
    } else {
      this.preferredSessionTypes.push(this.fb.control(type));
    }
  }

  isSessionTypeSelected(type: MenteePreferredSessionType): boolean {
    return this.preferredSessionTypes.controls.some((control) => control.value === type);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.avatarError.set(null);

    if (!this.isValidAvatarType(file)) {
      this.avatarError.set('Only JPG, JPEG, and PNG formats are allowed');
      input.value = '';
      return;
    }

    if (!this.isValidAvatarSize(file)) {
      this.avatarError.set('File size must be less than 5MB');
      input.value = '';
      return;
    }

    this.selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.set(e.target?.result as string);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  private isValidAvatarType(file: File): boolean {
    return ProfileSettingsPageComponent.ALLOWED_AVATAR_TYPES.includes(file.type);
  }

  private isValidAvatarSize(file: File): boolean {
    return file.size <= ProfileSettingsPageComponent.MAX_AVATAR_SIZE_BYTES;
  }

  removeAvatarPreview(input?: HTMLInputElement): void {
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.avatarError.set(null);
    if (input) {
      input.value = '';
    }
  }

  removeCurrentAvatar(input?: HTMLInputElement): void {
    this.currentAvatarUrl.set(null);
    if (input) {
      input.value = '';
    }
  }

  toggleDay(day: DaysInWeek): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      daySchedule.enabled = !daySchedule.enabled;
    });
  }

  addTimeFrame(day: DaysInWeek): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      if (
        daySchedule.timeFrames.length < ProfileSettingsPageComponent.MAX_TIME_FRAMES_PER_DAY
      ) {
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

  updateTimeFrame(
    day: DaysInWeek,
    timeFrameIndex: number,
    field: 'from' | 'to',
    value: string
  ): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      if (!daySchedule.timeFrames[timeFrameIndex]) return;
      daySchedule.timeFrames[timeFrameIndex][field] = value;
    });
  }

  getDaySchedule(day: DaysInWeek): DayAvailability | undefined {
    return this.availabilitySchedule().find((d) => d.day === day);
  }

  private buildAvailabilityPayload(): Array<{ day: DaysInWeek; timeFrames: TimeFrame[] }> {
    return this.availabilitySchedule()
      .filter((day) => day.enabled)
      .map((day) => ({
        day: day.day,
        timeFrames: day.timeFrames,
      }));
  }

  private buildMenteeProfileData(): Partial<UpdateMenteeProfileInterface> {
    return {
      bio: this.profileForm.value.bio,
      phoneNumber: this.profileForm.value.phoneNumber,
      country: this.profileForm.value.country,
      timezone: this.profileForm.value.timezone,
      language: this.profileForm.value.language,
      learningGoals: this.learningGoals.value.filter((g: string) => g.trim()),
      areasOfInterest: this.areasOfInterest.value,
      preferredSessionType: this.preferredSessionTypes.value,
    };
  }

  private buildMentorProfileData(): Partial<UpdateMentorProfileInterface> {
    const availability = this.buildAvailabilityPayload();
    return {
      bio: this.profileForm.value.bio,
      phoneNumber: this.profileForm.value.phoneNumber,
      country: this.profileForm.value.country,
      timezone: this.profileForm.value.timezone,
      language: this.profileForm.value.language,
      areasOfExpertise: this.areasOfExpertise.value,
      yearsOfExperience: Number(this.profileForm.value.yearsOfExperience),
      skills: this.mentorSkills,
      ...(availability.length > 0 && { availability }),
    };
  }

  private validateBeforeSubmit(): boolean {
    if (this.isMentor()) {
      if (this.areasOfExpertise.length === 0) {
        this.toastService.error('Please select at least one area of expertise');
        return false;
      }
      return true;
    }

    if (this.areasOfInterest.length === 0) {
      this.toastService.error('Please select at least one area of interest');
      return false;
    }

    if (this.preferredSessionTypes.length === 0) {
      this.toastService.error('Please select at least one preferred session type');
      return false;
    }

    return true;
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid || this.isSubmitting()) return;

    if (!this.validateBeforeSubmit()) return;

    const user = this.currentUser();
    if (!user) {
      this.toastService.error('User session not found. Please login again.');
      this.router.navigate([APP_ROUTES.LOGIN]);
      return;
    }

    this.isSubmitting.set(true);

    try {
      if (this.isMentor()) {
        await firstValueFrom(
          this.store.dispatch(
            new AuthActions.UpdateMentorProfile({
              userId: user.id,
              profileData: this.buildMentorProfileData(),
              avatarFile: this.selectedAvatarFile || undefined,
            })
          )
        );
      } else {
        await firstValueFrom(
          this.store.dispatch(
            new AuthActions.UpdateMenteeProfile({
              userId: user.id,
              profileData: this.buildMenteeProfileData(),
              avatarFile: this.selectedAvatarFile || undefined,
            })
          )
        );
      }

      this.toastService.success('Profile updated successfully!');
      this.commitAvatarAfterSuccessfulUpdate();
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

  /**
   * Keep the newly chosen photo visible after save.
   * Preview is cleared on success, so promote it to the current avatar URL.
   */
  private commitAvatarAfterSuccessfulUpdate(): void {
    const preview = this.avatarPreview();
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);

    if (preview) {
      this.currentAvatarUrl.set(preview);
    }

    void this.refreshAvatarFromServer();
  }

  private async refreshAvatarFromServer(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    try {
      const profileResponse = await firstValueFrom(
        this.profileService.getUserProfile(user.id)
      );
      if (!profileResponse.data) return;

      const avatarUrl = resolveAvatarPublicUrl(
        profileResponse.data as Record<string, unknown>,
        ''
      );
      if (avatarUrl) {
        this.currentAvatarUrl.set(avatarUrl);
      }
    } catch {
      // Keep the preview-promoted URL if refresh fails.
    }
  }
}
