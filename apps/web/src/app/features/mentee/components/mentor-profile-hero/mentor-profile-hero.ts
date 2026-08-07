import { Component, input } from '@angular/core';
import { AvatarAttachmentsInterface } from '@gurokonekt/models/interfaces/attachments/attachments.model';
import { MentorProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { getCountryDisplayName } from '../../../../shared/utils/location-data.util';
import { getLanguageLabel } from '../../../../shared/utils';

@Component({
  selector: 'app-mentor-profile-hero',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './mentor-profile-hero.html',
})
export class MentorProfileHero {
  mentorProfile = input.required<MentorProfileInterface>();
  mentorFullName = input.required<string>();
  averageRating = input<number | null>(null);
  ratingCount = input(0);

  protected getMentorTitle(): string {
    return this.mentorProfile().title || 'Verified Mentor';
  }

  protected getMentorLocation(): string {
    const { country, timezone } = this.mentorProfile().user;
    const countryLabel = country ? getCountryDisplayName(country) : '';

    return [  timezone, countryLabel].filter(Boolean).join(' ');
  }

  protected getMentorTimezone(): string {
    return this.mentorProfile().user.timezone || 'Timezone not listed';
  }

  protected getMentorCountry(): string {
    const country = this.mentorProfile().user.country;
    return country ? getCountryDisplayName(country) : 'Country not listed';
  }

  protected getMentorLanguage(): string {
    const language = this.mentorProfile().user.language;
    return language ? getLanguageLabel(language) : 'Language not listed';
  }

  protected getMentorExperience(): string {
    const yearsOfExperience = this.mentorProfile().yearsOfExperience;

    if (!yearsOfExperience) {
      return 'Experience not listed';
    }

    return `${yearsOfExperience}+ ${
      yearsOfExperience === 1 ? 'year' : 'years'
    } experience`;
  }

  protected getMentorAvatarUrl(): string {
    const fallbackAvatar = 'assets/img/no_profile_avatar.png';
    const avatarAttachments = this.mentorProfile().user.avatarAttachments as
      | AvatarAttachmentsInterface
      | AvatarAttachmentsInterface[]
      | null;

    if (Array.isArray(avatarAttachments)) {
      return avatarAttachments[0]?.publicUrl || fallbackAvatar;
    }

    return avatarAttachments?.publicUrl || fallbackAvatar;
  }

  protected getFormattedAverageRating(): string {
    const rating = this.averageRating();

    if (!rating) {
      return 'No reviews yet';
    }

    return rating.toFixed(1);
  }
}
