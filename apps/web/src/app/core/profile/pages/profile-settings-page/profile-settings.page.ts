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
import {
  FormArrayTextListComponent,
  createFormArrayTextControl,
} from '../../../../shared/components/form-array-text-list/form-array-text-list.component';
import {
  AvatarCropModalComponent,
  type AvatarCropResult,
} from '../../../../shared/components/avatar-crop-modal/avatar-crop-modal.component';
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
import { formatTimeRange } from '../../../../features/mentor/pages/mentor-manage-availability-page/availability.helpers';
import { FORM_FIELD_VALIDATORS } from '../../../../shared/constants/form-validation-configs.constants';
import { VALIDATION_MESSAGES } from '../../../../shared/constants/validation-patterns.constants';

interface ProfileSettingsDraft {
  userId: string;
  bio: string;
  phoneNumber: string;
  country: string;
  timezone: string;
  language: string;
  linkedInUrl: string;
  yearsOfExperience: number | null;
  areasOfExpertise: string[];
  skills: string[];
  learningGoals: string[];
  areasOfInterest: string[];
  preferredSessionType: MenteePreferredSessionType[];
}

@Component({
  selector: 'app-profile-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    FormArrayTextListComponent,
    AvatarCropModalComponent,
  ],
  templateUrl: './profile-settings.page.html',
})
export class ProfileSettingsPageComponent implements OnInit {
  private static readonly MAX_LEARNING_GOALS = 5;
  private static readonly MAX_AREAS_OF_INTEREST = 5;
  private static readonly MAX_AREAS_OF_EXPERTISE = 10;
  private static readonly MAX_SKILLS = 8;
  private static readonly MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  private static readonly MAX_VERIFICATION_FILES = 5;
  private static readonly MAX_VERIFICATION_FILE_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly ALLOWED_VERIFICATION_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];
  private static readonly MAX_LEARNING_GOAL_LENGTH = 500;
  private static readonly DRAFT_STORAGE_KEY = 'profile-settings-draft';

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
  protected isAvatarCropOpen = signal(false);
  protected avatarCropEvent = signal<Event | null>(null);
  protected avatarCropSourceFile = signal<File | null>(null);
  protected selectedVerificationFiles = signal<File[]>([]);
  protected verificationFileError = signal<string | null>(null);

  protected readonly currentUser = this.store.selectSignal(AuthSelectors.user);
  protected readonly isMentor = computed(
    () => this.currentUser()?.role === UserRole.Mentor
  );

  protected readonly isMentee = computed(() => this.currentUser()?.role === 'mentee');
  
  // Expose enums to template
  protected readonly MenteePreferredSessionType = MenteePreferredSessionType;
  protected readonly daysOfWeek = Object.values(DaysInWeek);
  protected readonly manageAvailabilityRoute = APP_ROUTES.MANAGE_AVAILABILITY;
  protected readonly maxSkills = ProfileSettingsPageComponent.MAX_SKILLS;
  protected readonly maxVerificationFiles =
    ProfileSettingsPageComponent.MAX_VERIFICATION_FILES;
  protected readonly linkedInUrlErrorMessage = VALIDATION_MESSAGES.LINKEDIN_URL;
  protected readonly phoneErrorMessage = VALIDATION_MESSAGES.PHONE;

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

  ngOnInit(): void {
    this.initializeForm();
    this.initializeAvailability();
    this.loadProfileData();
  }

  private initializeForm(): void {
    const mentor = this.isMentor();

    this.profileForm = this.fb.group({
      // Bio comes from post-login setup (not registration); keep the same 50–500 rule.
      bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      // Shared registration fields — same validators as mentee/mentor register forms.
      phoneNumber: ['', [...FORM_FIELD_VALIDATORS.PHONE_NUMBER]],
      country: ['', [...FORM_FIELD_VALIDATORS.COUNTRY]],
      timezone: ['', [...FORM_FIELD_VALIDATORS.TIMEZONE]],
      language: ['', [...FORM_FIELD_VALIDATORS.LANGUAGE]],
      linkedInUrl: ['', [...FORM_FIELD_VALIDATORS.LINKEDIN_URL]],
      yearsOfExperience: [
        null as number | null,
        mentor ? [...FORM_FIELD_VALIDATORS.YEARS_OF_EXPERIENCE] : [],
      ],
      learningGoals: this.fb.array([]),
      areasOfInterest: this.fb.array([], mentor ? [] : [Validators.required]),
      areasOfExpertise: this.fb.array(
        [],
        mentor ? [...FORM_FIELD_VALIDATORS.EXPERTISE_AREAS] : []
      ),
      skills: this.fb.array([]),
      preferredSessionType: this.fb.array([], mentor ? [] : [Validators.required]),
    });
  }

  private initializeAvailability(): void {
    const schedule: DayAvailability[] = this.daysOfWeek.map((day) => ({
      day,
      enabled: false,
      timeFrames: [],
    }));
    this.availabilitySchedule.set(schedule);
  }

  protected formatAvailabilityTimeRange(timeFrame: TimeFrame): string {
    return formatTimeRange(timeFrame);
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

        // Restore unsaved edits after navigating away (e.g. Manage Availability).
        // Availability always stays server-fresh from populateForm above.
        this.restoreDraftIfPresent(user.id);
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
    const linkedInUrl =
      typeof mentorProfile['linkedInUrl'] === 'string'
        ? mentorProfile['linkedInUrl']
        : '';

    this.profileForm.patchValue({
      yearsOfExperience:
        typeof yearsOfExperience === 'number' ? yearsOfExperience : null,
      linkedInUrl,
    });

    const skills = Array.isArray(mentorProfile['skills'])
      ? (mentorProfile['skills'] as string[])
      : [];
    this.skills.clear();
    if (skills.length > 0) {
      skills.forEach((skill) => {
        const control = createFormArrayTextControl(this.fb);
        control.setValue(skill);
        this.skills.push(control);
      });
    }

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
    const schedule: DayAvailability[] = this.daysOfWeek.map((day) => ({
      day,
      enabled: false,
      timeFrames: [],
    }));

    availability.forEach((slot) => {
      const daySchedule = schedule.find((d) => d.day === slot.day);
      if (daySchedule) {
        daySchedule.enabled = (slot.timeFrames?.length ?? 0) > 0;
        daySchedule.timeFrames = slot.timeFrames ?? [];
      }
    });
    this.availabilitySchedule.set(schedule);
  }

  protected goToManageAvailability(): void {
    const user = this.currentUser();
    if (!user) {
      this.toastService.error('User session not found');
      return;
    }

    this.saveDraft(user.id);
    void this.router.navigate(['/', this.manageAvailabilityRoute]);
  }

  private saveDraft(userId: string): void {
    const draft: ProfileSettingsDraft = {
      userId,
      bio: this.profileForm.value.bio ?? '',
      phoneNumber: this.profileForm.value.phoneNumber ?? '',
      country: this.profileForm.value.country ?? '',
      timezone: this.profileForm.value.timezone ?? '',
      language: this.profileForm.value.language ?? '',
      linkedInUrl: this.profileForm.value.linkedInUrl ?? '',
      yearsOfExperience:
        this.profileForm.value.yearsOfExperience === null ||
        this.profileForm.value.yearsOfExperience === undefined ||
        this.profileForm.value.yearsOfExperience === ''
          ? null
          : Number(this.profileForm.value.yearsOfExperience),
      areasOfExpertise: [...(this.areasOfExpertise.value as string[])],
      skills: [...(this.skills.value as string[])],
      learningGoals: [...(this.learningGoals.value as string[])],
      areasOfInterest: [...(this.areasOfInterest.value as string[])],
      preferredSessionType: [
        ...(this.preferredSessionTypes.value as MenteePreferredSessionType[]),
      ],
    };

    try {
      sessionStorage.setItem(
        ProfileSettingsPageComponent.DRAFT_STORAGE_KEY,
        JSON.stringify(draft)
      );
    } catch (error) {
      console.error('Failed to save profile settings draft:', error);
    }
  }

  private restoreDraftIfPresent(userId: string): void {
    try {
      const raw = sessionStorage.getItem(
        ProfileSettingsPageComponent.DRAFT_STORAGE_KEY
      );
      if (!raw) return;

      const draft = JSON.parse(raw) as ProfileSettingsDraft;
      if (draft.userId !== userId) {
        this.clearDraft();
        return;
      }

      this.profileForm.patchValue({
        bio: draft.bio ?? '',
        phoneNumber: draft.phoneNumber ?? '',
        country: draft.country ?? '',
        timezone: draft.timezone ?? '',
        language: draft.language ?? '',
        linkedInUrl: draft.linkedInUrl ?? '',
        yearsOfExperience: draft.yearsOfExperience,
      });

      if (this.isMentor()) {
        this.replaceStringFormArray(this.areasOfExpertise, draft.areasOfExpertise ?? []);
        this.replaceSkillsFormArray(draft.skills ?? []);
      } else {
        this.replaceLearningGoals(draft.learningGoals ?? []);
        this.replaceStringFormArray(this.areasOfInterest, draft.areasOfInterest ?? []);
        this.preferredSessionTypes.clear();
        (draft.preferredSessionType ?? []).forEach((type) => {
          this.preferredSessionTypes.push(this.fb.control(type));
        });
      }
    } catch (error) {
      console.error('Failed to restore profile settings draft:', error);
      this.clearDraft();
    }
  }

  private replaceStringFormArray(formArray: FormArray, values: string[]): void {
    formArray.clear();
    values.forEach((value) => formArray.push(this.fb.control(value)));
  }

  private replaceSkillsFormArray(values: string[]): void {
    this.skills.clear();
    values.forEach((skill) => {
      const control = createFormArrayTextControl(this.fb);
      control.setValue(skill);
      this.skills.push(control);
    });
  }

  private replaceLearningGoals(values: string[]): void {
    this.learningGoals.clear();
    values.forEach((goal) => {
      this.learningGoals.push(
        this.fb.control(goal, [
          Validators.maxLength(ProfileSettingsPageComponent.MAX_LEARNING_GOAL_LENGTH),
        ])
      );
    });
  }

  private clearDraft(): void {
    sessionStorage.removeItem(ProfileSettingsPageComponent.DRAFT_STORAGE_KEY);
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

  get skills(): FormArray {
    return this.profileForm.get('skills') as FormArray;
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

    // Keep the File for the cropper; clearing the input would empty the change event's FileList.
    this.avatarCropSourceFile.set(file);
    this.avatarCropEvent.set(null);
    this.isAvatarCropOpen.set(true);
    input.value = '';
  }

  protected onAvatarCropped(result: AvatarCropResult): void {
    if (this.avatarPreview()?.startsWith('blob:')) {
      URL.revokeObjectURL(this.avatarPreview()!);
    }

    this.selectedAvatarFile = result.file;
    this.avatarPreview.set(result.previewUrl);
    this.avatarError.set(null);
    this.closeAvatarCropModal();
  }

  protected onAvatarCropCancelled(): void {
    this.closeAvatarCropModal();
  }

  private closeAvatarCropModal(): void {
    this.isAvatarCropOpen.set(false);
    this.avatarCropEvent.set(null);
    this.avatarCropSourceFile.set(null);
  }

  private isValidAvatarType(file: File): boolean {
    return ProfileSettingsPageComponent.ALLOWED_AVATAR_TYPES.includes(file.type);
  }

  private isValidAvatarSize(file: File): boolean {
    return file.size <= ProfileSettingsPageComponent.MAX_AVATAR_SIZE_BYTES;
  }

  removeAvatarPreview(input?: HTMLInputElement): void {
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

  removeCurrentAvatar(input?: HTMLInputElement): void {
    this.currentAvatarUrl.set(null);
    if (input) {
      input.value = '';
    }
  }

  protected onVerificationFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    this.verificationFileError.set(null);

    const remainingSlots =
      ProfileSettingsPageComponent.MAX_VERIFICATION_FILES -
      this.selectedVerificationFiles().length;
    if (remainingSlots <= 0) {
      this.verificationFileError.set(
        `You can upload up to ${ProfileSettingsPageComponent.MAX_VERIFICATION_FILES} documents`
      );
      input.value = '';
      return;
    }

    const nextFiles = [...this.selectedVerificationFiles()];
    for (const file of Array.from(input.files).slice(0, remainingSlots)) {
      if (!ProfileSettingsPageComponent.ALLOWED_VERIFICATION_TYPES.includes(file.type)) {
        this.verificationFileError.set('Only PDF, PNG, and JPEG documents are allowed');
        input.value = '';
        return;
      }

      if (file.size > ProfileSettingsPageComponent.MAX_VERIFICATION_FILE_SIZE_BYTES) {
        this.verificationFileError.set('Each document must be less than 5MB');
        input.value = '';
        return;
      }

      nextFiles.push(file);
    }

    this.selectedVerificationFiles.set(nextFiles);
    input.value = '';
  }

  protected removeVerificationFile(index: number): void {
    const nextFiles = this.selectedVerificationFiles().filter((_, i) => i !== index);
    this.selectedVerificationFiles.set(nextFiles);
    this.verificationFileError.set(null);
  }

  protected clearVerificationFiles(): void {
    this.selectedVerificationFiles.set([]);
    this.verificationFileError.set(null);
  }

  protected formatFileSizeMb(sizeBytes: number): string {
    return (sizeBytes / (1024 * 1024)).toFixed(2);
  }

  private buildMenteeProfileData(): Partial<UpdateMenteeProfileInterface> {
    return {
      bio: this.profileForm.value.bio,
      phoneNumber: this.profileForm.value.phoneNumber,
      country: this.profileForm.value.country,
      timezone: this.profileForm.value.timezone,
      language: this.profileForm.value.language,
      ...(this.isMentee() && {
        learningGoals: this.learningGoals.value.filter((g: string) => g.trim()),
        areasOfInterest: this.areasOfInterest.value,
      }),
      preferredSessionType: this.preferredSessionTypes.value,
    };
  }

  private buildMentorProfileData(): Partial<UpdateMentorProfileInterface> {
    const linkedInUrl = (this.profileForm.value.linkedInUrl as string | null)?.trim() || null;
    const skills = (this.skills.value as string[])
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    return {
      bio: this.profileForm.value.bio,
      phoneNumber: this.profileForm.value.phoneNumber,
      country: this.profileForm.value.country,
      timezone: this.profileForm.value.timezone,
      language: this.profileForm.value.language,
      linkedInUrl,
      areasOfExpertise: this.areasOfExpertise.value,
      yearsOfExperience: Number(this.profileForm.value.yearsOfExperience),
      skills,
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

    if (this.isMentee() && this.areasOfInterest.length === 0) {
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
    if (this.isSubmitting()) return;

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.error('Please fix the highlighted fields before updating.');
      return;
    }

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
              documentFiles:
                this.selectedVerificationFiles().length > 0
                  ? this.selectedVerificationFiles()
                  : undefined,
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
      this.clearDraft();
      this.clearVerificationFiles();
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
