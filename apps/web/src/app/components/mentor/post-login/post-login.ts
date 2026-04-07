import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { DaysInWeek } from '@gurokonekt/models/interfaces/user/user.model';
import type { UpdateMentorProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';

import type { DayAvailability, TimeFrame } from '../../../interfaces/post-login.interface';
import { ExpertiseSelectionHelper } from '../../../helpers/expertise-selection.helper';
import { ToastService } from '../../../services/toast.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { APP_ROUTES } from '../../../constants/routes';
import { AuthState } from '../../../store/auth/auth.state';
import * as AuthActions from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-mentor-post-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './post-login.html',
  styleUrl: './post-login.scss',
})
export class MentorPostLogin implements OnInit {
  private static readonly MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  private static readonly MAX_TIME_FRAMES_PER_DAY = 3;
  private static readonly MAX_SKILLS = 8;

  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  protected readonly currentStep = signal(1);
  protected readonly totalSteps = 3;
  protected readonly isSubmitting = signal(false);

  protected readonly daysOfWeek = Object.values(DaysInWeek);
  protected readonly expertiseOptions = ExpertiseSelectionHelper.EXPERTISE_OPTIONS;

  protected readonly currentUser = this.store.selectSignal(AuthState.user);
  protected readonly avatarPreview = signal<string | null>(null);
  protected readonly avatarError = signal<string | null>(null);

  protected selectedAvatarFile: File | null = null;
  protected profileForm!: FormGroup;
  protected availabilitySchedule = signal<DayAvailability[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.initializeAvailability();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      bio: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(500)]],
      areasOfExpertise: this.fb.array([], Validators.required),
      skills: this.fb.array([], Validators.required),
    });

    this.addSkill();
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

  private updateScheduleForDay(day: DaysInWeek, update: (daySchedule: DayAvailability) => void): void {
    const schedule = this.availabilitySchedule();
    const dayIndex = schedule.findIndex((entry) => entry.day === day);
    if (dayIndex < 0) {
      return;
    }

    update(schedule[dayIndex]);
    this.availabilitySchedule.set([...schedule]);
  }

  get areasOfExpertise(): FormArray {
    return this.profileForm.get('areasOfExpertise') as FormArray;
  }

  get skills(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }

  addSkill(): void {
    if (this.skills.length >= MentorPostLogin.MAX_SKILLS) {
      return;
    }

    this.skills.push(this.fb.control('', [Validators.required, Validators.minLength(2)]));
  }

  removeSkill(index: number): void {
    if (this.skills.length <= 1) {
      return;
    }

    this.skills.removeAt(index);
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

    if (!MentorPostLogin.ALLOWED_AVATAR_TYPES.includes(file.type)) {
      this.avatarError.set('Only JPG, JPEG, and PNG formats are allowed');
      return;
    }

    if (file.size > MentorPostLogin.MAX_AVATAR_SIZE_BYTES) {
      this.avatarError.set('File size must be less than 5MB');
      return;
    }

    this.selectedAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      this.avatarPreview.set(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.selectedAvatarFile = null;
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  toggleDay(day: DaysInWeek): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      daySchedule.enabled = !daySchedule.enabled;
    });
  }

  addTimeFrame(day: DaysInWeek): void {
    this.updateScheduleForDay(day, (daySchedule) => {
      if (daySchedule.timeFrames.length < MentorPostLogin.MAX_TIME_FRAMES_PER_DAY) {
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
      if (!daySchedule.timeFrames[timeFrameIndex]) {
        return;
      }
      daySchedule.timeFrames[timeFrameIndex][field] = value;
    });
  }

  getDaySchedule(day: DaysInWeek): DayAvailability | undefined {
    return this.availabilitySchedule().find((schedule) => schedule.day === day);
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
    return this.availabilitySchedule().some((day) => day.enabled && day.timeFrames.length > 0);
  }

  private buildAvailabilityPayload(): Array<{ day: DaysInWeek; timeFrames: TimeFrame[] }> {
    return this.availabilitySchedule()
      .filter((day) => day.enabled)
      .map((day) => ({
        day: day.day,
        timeFrames: day.timeFrames,
      }));
  }

  private buildProfileData(): Partial<UpdateMentorProfileInterface> {
    return {
      bio: this.profileForm.value.bio,
      areasOfExpertise: this.areasOfExpertise.value,
      skills: this.skills.value,
      availability: this.buildAvailabilityPayload(),
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
    if (this.profileForm.invalid || this.isSubmitting()) {
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
            avatarFile: this.selectedAvatarFile,
          })
        )
      );

      this.toastService.success('Mentor profile setup completed successfully!', 'Welcome!');
      await this.router.navigate([APP_ROUTES.DASHBOARD]);
    } catch (error) {
      const message = (error as { message?: string })?.message;
      this.toastService.error(message || 'Failed to setup mentor profile. Please try again.', 'Error');
      this.isSubmitting.set(false);
    }
  }
}
