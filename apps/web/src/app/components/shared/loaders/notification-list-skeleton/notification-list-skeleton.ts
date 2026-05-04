import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-notification-list-skeleton',
  standalone: true,
  templateUrl: './notification-list-skeleton.html',
})
export class NotificationListSkeleton {
  count = input(3);
  compact = input(false);

  protected readonly items = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index)
  );
}
