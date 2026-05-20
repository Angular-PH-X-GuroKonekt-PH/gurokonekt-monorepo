import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-booking-table-skeleton',
  standalone: true,
  templateUrl: './booking-table-skeleton.component.html',
})
export class BookingTableSkeleton {
  count = input(5);

  protected readonly items = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index)
  );
}