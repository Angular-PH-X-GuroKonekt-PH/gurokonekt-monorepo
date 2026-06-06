import { Component, input } from '@angular/core';
import { IconComponent, IconName } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-metric-card',
  imports: [IconComponent],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div [class]="'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg ' + iconBg()">
        <app-icon [name]="icon()" class="h-6 w-6" />
      </div>
      <div class="min-w-0">
        <p class="text-sm text-gray-500 truncate">{{ label() }}</p>
        @if (loading()) {
          <div class="h-7 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
        } @else {
          <p class="text-2xl font-bold text-gray-900">{{ value() ?? '—' }}</p>
        }
      </div>
    </div>
  `,
})
export class MetricCardComponent {
  readonly label = input.required<string>();
  readonly value = input<number | null>(null);
  readonly icon = input.required<IconName>();
  readonly iconBg = input<string>('bg-blue-50 text-blue-600');
  readonly loading = input<boolean>(false);
}
