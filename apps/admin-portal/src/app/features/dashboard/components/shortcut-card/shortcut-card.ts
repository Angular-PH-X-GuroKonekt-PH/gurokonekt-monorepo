import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-shortcut-card',
  imports: [RouterLink, IconComponent],
  template: `
    <a
      [routerLink]="route()"
      class="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-3 hover:border-orange-300 hover:shadow-sm transition-all group"
    >
      <div class="flex items-center gap-3">
        <div [class]="'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ' + iconBg()">
          <app-icon [name]="icon()" class="h-5 w-5" />
        </div>
        <span class="font-medium text-gray-800 group-hover:text-orange-600 transition-colors">{{ label() }}</span>
      </div>
      <app-icon name="chevron-right" class="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
    </a>
  `,
})
export class ShortcutCardComponent {
  readonly label = input.required<string>();
  readonly route = input.required<string>();
  readonly icon = input.required<IconName>();
  readonly iconBg = input<string>('bg-orange-50 text-orange-500');
}
