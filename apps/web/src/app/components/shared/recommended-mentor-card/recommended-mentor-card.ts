import { Component, input } from '@angular/core';
import { MentorProfileInterface } from '@gurokonekt/models/interfaces/user/user.model';
import { StarRating } from '../star-rating/star-rating';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-recommended-mentor-card',
  imports: [StarRating, RouterLink],
  templateUrl: './recommended-mentor-card.html',
  styleUrl: './recommended-mentor-card.scss',
})
export class RecommendedMentorCard {


  mentorInformation = input<MentorProfileInterface[]>([]);

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
}
