import { Injectable } from '@angular/core';
import { MenteePreferredSessionType } from '@gurokonekt/models/interfaces/user/user.model';

export interface ProfileSettingsDraft {
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

@Injectable({ providedIn: 'root' })
export class ProfileSettingsDraftService {
  private static readonly STORAGE_KEY = 'profile-settings-draft';

  save(draft: ProfileSettingsDraft): void {
    try {
      sessionStorage.setItem(
        ProfileSettingsDraftService.STORAGE_KEY,
        JSON.stringify(draft)
      );
    } catch {
      // Ignore quota / private-mode write failures.
    }
  }

  load(userId: string): ProfileSettingsDraft | null {
    try {
      const raw = sessionStorage.getItem(ProfileSettingsDraftService.STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const draft = JSON.parse(raw) as ProfileSettingsDraft;
      if (draft.userId !== userId) {
        this.clear();
        return null;
      }

      return draft;
    } catch {
      this.clear();
      return null;
    }
  }

  clear(): void {
    sessionStorage.removeItem(ProfileSettingsDraftService.STORAGE_KEY);
  }
}
