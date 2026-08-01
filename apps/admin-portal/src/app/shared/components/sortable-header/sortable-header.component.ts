import { Component, computed, input, output } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

export type SortOrder = 'asc' | 'desc';

/**
 * Sortable table header. Applied as an attribute on an existing `<th>` so the
 * table keeps its own layout classes:
 *
 *   <th class="px-6 py-3 text-left font-medium"
 *       app-sortable-header
 *       field="firstName"
 *       [activeField]="sortBy()"
 *       [activeOrder]="sortOrder()"
 *       (sort)="onSort($event)">Name</th>
 *
 * A null `activeField` means "no explicit sort" and every header renders neutral.
 */
@Component({
  selector: 'th[app-sortable-header]',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="group flex items-center gap-1 uppercase hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
      (click)="sort.emit(field())"
    >
      <ng-content />
      <app-icon
        [name]="indicator()"
        [class]="
          isActive()
            ? 'h-3.5 w-3.5 shrink-0 text-gray-700'
            : 'h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-gray-400'
        "
      />
    </button>
  `,
  host: {
    '[attr.aria-sort]': 'ariaSort()',
  },
})
export class SortableHeaderComponent {
  field = input.required<string>();
  activeField = input<string | null>(null);
  activeOrder = input<SortOrder>('desc');

  sort = output<string>();

  protected isActive = computed(() => this.activeField() === this.field());

  protected indicator = computed<IconName>(() => {
    if (!this.isActive()) return 'sort-none';
    return this.activeOrder() === 'asc' ? 'sort-asc' : 'sort-desc';
  });

  protected ariaSort = computed(() => {
    if (!this.isActive()) return 'none';
    return this.activeOrder() === 'asc' ? 'ascending' : 'descending';
  });
}
