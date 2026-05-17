import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-mentor-card-list-skeleton',
  standalone: true,
  templateUrl: './mentor-card-list-skeleton.component.html',
})
export class MentorCardListSkeleton {
  count = input(3);

  protected readonly items = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index)
  );
}
