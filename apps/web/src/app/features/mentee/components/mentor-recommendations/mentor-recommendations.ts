import { Component, computed, input } from '@angular/core';

import { MentorCardListSkeleton } from '../mentor-card-list-skeleton/mentor-card-list-skeleton.component';
import { MentorInfoCard } from '../mentor-info-card/mentor-info-card';
import { RecommendedMentorsState } from '../../interfaces/search-mentor.interface';

@Component({
  selector: 'app-mentor-recommendations',
  standalone: true,
  imports: [MentorInfoCard, MentorCardListSkeleton],
  templateUrl: './mentor-recommendations.html',
})
export class MentorRecommendations {
  state = input.required<RecommendedMentorsState>();

  protected readonly heading = computed(() =>
    this.state().isPersonalized ? 'Recommended for you' : 'Featured mentors',
  );

  protected readonly subtitle = computed(() =>
    this.state().isPersonalized
      ? 'Based on your goals and interests'
      : 'Popular mentors on Gurokonekt',
  );

  protected readonly hasMentors = computed(
    () => this.state().mentors.length > 0,
  );
}
