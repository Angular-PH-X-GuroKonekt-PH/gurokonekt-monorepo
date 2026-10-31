import { Component, computed, input } from '@angular/core';
import { MentorBadgeInterface } from '@gurokonekt/models/interfaces/achievement/achievement.model';

/** Full class strings (not built dynamically) so Tailwind keeps them. */
const LIGHT: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  green: 'bg-green-50 text-green-800 border-green-200',
  purple: 'bg-purple-50 text-purple-800 border-purple-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};
const DARK = 'bg-white/10 text-white border-white/20';

/**
 * A mentor's verified achievement badges (issue #419).
 * `variant="dark"` for dark backgrounds such as the profile hero.
 */
@Component({
  selector: 'app-mentor-badges',
  standalone: true,
  template: `
    @if (badges().length) {
      <ul class="flex flex-wrap gap-1.5" aria-label="Verified achievements">
        @for (badge of shown(); track badge.id) {
          <li
            class="inline-flex items-center gap-1 rounded-full border font-semibold"
            [class]="classesFor(badge.color) + (size() === 'sm' ? ' px-2 py-0.5 text-2xs' : ' px-3 py-1 text-xs')"
            [title]="badge.description"
          >
            <span aria-hidden="true">{{ badge.icon }}</span>{{ badge.name }}
          </li>
        }
        @if (hiddenCount() > 0) {
          <li
            class="inline-flex items-center rounded-full border font-semibold"
            [class]="classesFor('slate') + (size() === 'sm' ? ' px-2 py-0.5 text-2xs' : ' px-3 py-1 text-xs')"
          >
            +{{ hiddenCount() }} more
          </li>
        }
      </ul>
    }
  `,
})
export class MentorBadgesComponent {
  readonly badges = input<MentorBadgeInterface[]>([]);
  /** Show at most this many, then "+N more". 0 = show all. */
  readonly max = input(0);
  readonly size = input<'sm' | 'md'>('md');
  readonly variant = input<'light' | 'dark'>('light');

  protected readonly shown = computed(() => (this.max() > 0 ? this.badges().slice(0, this.max()) : this.badges()));
  protected readonly hiddenCount = computed(() => this.badges().length - this.shown().length);

  protected classesFor(color: string): string {
    return this.variant() === 'dark' ? DARK : (LIGHT[color] ?? LIGHT['slate']);
  }
}
