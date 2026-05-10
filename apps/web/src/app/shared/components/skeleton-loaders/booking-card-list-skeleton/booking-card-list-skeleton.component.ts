import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-booking-card-list-skeleton',
  standalone: true,
  templateUrl: './booking-card-list-skeleton.component.html',
})
export class BookingCardListSkeleton {
  count = input(3);

  protected readonly items = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index)
  );
}
