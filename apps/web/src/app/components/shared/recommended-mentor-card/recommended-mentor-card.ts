import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  MentorProfileSearch,
  MentorSearchItemInterface,
} from '@gurokonekt/models/interfaces/search/search.model';
import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-recommended-mentor-card',
  imports: [RouterLink, IconComponent],
  templateUrl: './recommended-mentor-card.html',
  styleUrl: './recommended-mentor-card.scss',
})
export class RecommendedMentorCard {
  mentor = input<MentorSearchItemInterface | null>(null);

  getSubtitle(mentor: MentorSearchItemInterface): string {
    const profile = this.getProfile(mentor);

    if (profile?.areasOfExpertise.length) {
      return profile.areasOfExpertise[0];
    }

    if (profile?.skills.length) {
      return profile.skills[0];
    }

    return 'Mentor';
  }

  getPrimaryExpertise(areasOfExpertise: string[]): string[] {
    return areasOfExpertise.slice(0, 3);
  }

  getPrimarySkills(skills: string[]): string[] {
    return skills.slice(0, 4);
  }

  getAvailabilityLabel(mentor: MentorSearchItemInterface): string {
    const firstAvailability = this.getAvailability(mentor)[0];

    if (!firstAvailability?.day) {
      return 'No schedule available yet';
    }

    const firstTimeFrame = firstAvailability.timeFrames?.[0];

    if (!firstTimeFrame) {
      return this.capitalize(firstAvailability.day);
    }

    return `${this.capitalize(firstAvailability.day)} - ${this.formatTo12Hour(firstTimeFrame.from)}`;
  }

  getMetaSummary(mentor: MentorSearchItemInterface): string[] {
    const profile = this.getProfile(mentor);

    return [
      profile?.yearsOfExperience
        ? `${profile.yearsOfExperience}+ yrs experience`
        : '',
      mentor.language || '',
      mentor.country || '',
    ].filter(Boolean);
  }

  getProfile(mentor: MentorSearchItemInterface): MentorProfileSearch | null {
    return mentor.mentorProfiles[0] ?? null;
  }

  getAvailability(mentor: MentorSearchItemInterface): UserAvailabilityInterface[] {
    const availability = this.getProfile(mentor)?.availability;

    return Array.isArray(availability)
      ? (availability as UserAvailabilityInterface[])
      : [];
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
