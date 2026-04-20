import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-mentor-card-skeleton',
  templateUrl: './mentor-card-skeleton.html',
  styleUrl: './mentor-card-skeleton.scss',
})
export class MentorCardSkeleton {
  count = input(3);

  protected readonly items = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index)
  );
}
