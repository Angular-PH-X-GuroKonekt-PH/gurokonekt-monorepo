import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ACHIEVEMENT_COLORS,
  ACHIEVEMENT_ICONS,
  ACHIEVEMENT_METRICS,
  AchievementAwardType,
  AchievementCriterion,
  AchievementMetric,
  AdminAchievementInterface,
} from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { AchievementPayload } from '../../services/achievements.service';
import { badgeClasses } from '../../badge-styles';

/** Create or edit an achievement. Emits the payload; the page does the saving. */
@Component({
  selector: 'app-achievement-form-modal',
  imports: [FormsModule],
  templateUrl: './achievement-form-modal.html',
})
export class AchievementFormModalComponent implements OnInit {
  /** Set when editing; null when creating. */
  readonly achievement = input<AdminAchievementInterface | null>(null);
  readonly submitting = input(false);
  readonly saved = output<AchievementPayload>();
  readonly closed = output<void>();

  protected readonly icons = ACHIEVEMENT_ICONS;
  protected readonly colors = ACHIEVEMENT_COLORS;
  protected readonly metrics = Object.entries(ACHIEVEMENT_METRICS).map(([key, meta]) => ({
    key: key as AchievementMetric,
    ...meta,
  }));
  protected readonly AwardType = AchievementAwardType;
  protected readonly badgeClasses = badgeClasses;

  protected name = signal('');
  protected description = signal('');
  protected icon = signal<string>(ACHIEVEMENT_ICONS[0]);
  protected color = signal<string>(ACHIEVEMENT_COLORS[0]);
  protected awardType = signal<AchievementAwardType>(AchievementAwardType.Application);
  protected requirements = signal('');
  protected requiresProof = signal(true);
  protected autoApprove = signal(false);
  protected criteria = signal<AchievementCriterion[]>([{ metric: AchievementMetric.CompletedSessions, min: 10 }]);
  protected expires = signal(false);
  protected validityMonths = signal<number>(12);
  protected isActive = signal(true);
  protected error = signal<string | null>(null);

  protected readonly isEdit = computed(() => !!this.achievement());
  protected readonly isAutomatic = computed(() => this.awardType() === AchievementAwardType.Automatic);

  ngOnInit(): void {
    const a = this.achievement();
    if (!a) return;
    this.name.set(a.name);
    this.description.set(a.description);
    this.icon.set(a.icon);
    this.color.set(a.color);
    this.awardType.set(a.awardType);
    this.requirements.set(a.requirements ?? '');
    this.requiresProof.set(a.requiresProof);
    this.autoApprove.set(a.autoApprove);
    if (a.criteria.length) this.criteria.set(a.criteria.map((c) => ({ ...c })));
    this.expires.set(a.validityMonths !== null);
    this.validityMonths.set(a.validityMonths ?? 12);
    this.isActive.set(a.isActive);
  }

  protected unitFor(metric: AchievementMetric): string {
    return ACHIEVEMENT_METRICS[metric].unit;
  }

  protected stepFor(metric: AchievementMetric): number {
    return ACHIEVEMENT_METRICS[metric].step;
  }

  protected setCriterion(index: number, change: Partial<AchievementCriterion>): void {
    this.criteria.update((list) => list.map((c, i) => (i === index ? { ...c, ...change } : c)));
  }

  protected addCriterion(): void {
    const used = new Set(this.criteria().map((c) => c.metric));
    const next = this.metrics.find((m) => !used.has(m.key));
    if (next) this.criteria.update((list) => [...list, { metric: next.key, min: 1 }]);
  }

  protected removeCriterion(index: number): void {
    this.criteria.update((list) => list.filter((_, i) => i !== index));
  }

  protected submit(): void {
    this.error.set(null);
    if (!this.name().trim() || !this.description().trim()) {
      this.error.set('Name and description are required.');
      return;
    }
    if (this.isAutomatic() && !this.criteria().length) {
      this.error.set('Add at least one rule for an automatic achievement.');
      return;
    }
    if (this.isAutomatic() && this.criteria().some((c) => !(c.min > 0))) {
      this.error.set('Each rule needs a number greater than 0.');
      return;
    }
    if (this.expires() && !(this.validityMonths() >= 1)) {
      this.error.set('Enter how many months the badge stays valid.');
      return;
    }

    const payload: AchievementPayload = {
      name: this.name().trim(),
      description: this.description().trim(),
      icon: this.icon(),
      color: this.color(),
      awardType: this.awardType(),
      validityMonths: this.expires() ? Number(this.validityMonths()) : null,
      isActive: this.isActive(),
      ...(this.isAutomatic()
        ? { criteria: this.criteria().map((c) => ({ metric: c.metric, min: Number(c.min) })) }
        : {
            requirements: this.requirements().trim() || null,
            requiresProof: this.requiresProof(),
            autoApprove: this.autoApprove(),
          }),
    };
    this.saved.emit(payload);
  }
}
