import { Component, input } from '@angular/core';
import {
  MentorProfileSearch,
  MentorSearchItemInterface,
} from '@gurokonekt/models/interfaces/search/search.model';
import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { getLanguageLabel } from '../../../../shared/utils';

@Component({
  selector: 'app-mentor-info-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './mentor-info-card.html',
})
export class MentorInfoCard {
  mentor = input<MentorSearchItemInterface | null>(null);

  getProfile(mentor: MentorSearchItemInterface): MentorProfileSearch | null {
    return mentor.mentorProfiles[0] ?? null;
  }

  getPrimarySkills(skills: string[]): string[] {
    return skills.slice(0, 3);
  }

  getAvailability(mentor: MentorSearchItemInterface): UserAvailabilityInterface[] {
    const availability = this.getProfile(mentor)?.availability;

    return Array.isArray(availability)
      ? (availability as UserAvailabilityInterface[])
      : [];
  }

  getAvailabilityLabels(mentor: MentorSearchItemInterface): string[] {
    return this.getAvailability(mentor).flatMap((availability) => {
      if (!availability.day) {
        return [];
      }

      if (!availability.timeFrames?.length) {
        return [this.capitalize(availability.day)];
      }

      return availability.timeFrames.map((timeFrame) => {
        if (!timeFrame.from || !timeFrame.to) {
          return this.capitalize(availability.day);
        }

        return `${this.capitalize(availability.day)}, ${this.formatTo12Hour(timeFrame.from)} - ${this.formatTo12Hour(timeFrame.to)}`;
      });
    });
  }

  getFullName(mentor: MentorSearchItemInterface): string {
    return [mentor.firstName, mentor.lastName, mentor.suffix]
      .filter(Boolean)
      .join(' ');
  }

  getLanguages(mentor: MentorSearchItemInterface): string {
    return getLanguageLabel(mentor.language);
  }

  getExperience(profile: MentorProfileSearch | null): string {
    if (!profile?.yearsOfExperience) {
      return 'Not listed';
    }

    return `${profile.yearsOfExperience}+ Years`;
  }

  formatTo12Hour(time: string): string {
    const [hourStr, minute] = time.split(':');
    const hour = Number(hourStr);

    if (Number.isNaN(hour) || !minute) {
      return time;
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 || 12;

    return `${normalizedHour}:${minute} ${period}`;
  }

  private capitalize(value: string): string {
    if (!value) {
      return '';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
