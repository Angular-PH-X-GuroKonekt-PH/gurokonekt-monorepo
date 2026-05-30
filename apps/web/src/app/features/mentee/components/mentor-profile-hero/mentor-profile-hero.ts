import { Component, input } from '@angular/core';
import { AvatarAttachmentsInterface } from '@gurokonekt/models/interfaces/attachments/attachments.model';
import { MentorProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';

import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-mentor-profile-hero',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './mentor-profile-hero.html',
})
export class MentorProfileHero {
  mentorProfile = input.required<MentorProfileInterface>();
  mentorFullName = input.required<string>();

  protected getMentorTitle(): string {
    return this.mentorProfile().title || 'Professional Mentor';
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
}
