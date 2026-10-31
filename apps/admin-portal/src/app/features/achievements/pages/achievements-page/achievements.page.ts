import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AchievementAwardType,
  AdminAchievementInterface,
} from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { AchievementPayload, AchievementsAdminService } from '../../services/achievements.service';
import { AchievementFormModalComponent } from '../../components/achievement-form-modal/achievement-form-modal';
import { ReviewQueueComponent } from '../../components/review-queue/review-queue';
import { badgeClasses, describeCriteria } from '../../badge-styles';
import { ToastService } from '../../../../shared/services/toast.service';

type Tab = 'review' | 'catalog';

@Component({
  selector: 'app-achievements-page',
  imports: [AchievementFormModalComponent, ReviewQueueComponent],
  templateUrl: './achievements.page.html',
})
export class AchievementsPage implements OnInit {
  private readonly service = inject(AchievementsAdminService);
  private readonly toast = inject(ToastService);
  private readonly queue = viewChild(ReviewQueueComponent);

  protected readonly AwardType = AchievementAwardType;
  protected readonly badgeClasses = badgeClasses;
  protected readonly describeCriteria = describeCriteria;

  protected tab = signal<Tab>('review');
  protected achievements = signal<AdminAchievementInterface[]>([]);
  protected loading = signal(true);
  protected loadError = signal<string | null>(null);
  /** undefined = closed, null = creating, otherwise editing. */
  protected editing = signal<AdminAchievementInterface | null | undefined>(undefined);
  protected saving = signal(false);
  protected busyId = signal<string | null>(null);

  protected readonly pendingTotal = computed(() => this.achievements().reduce((sum, a) => sum + a.pendingCount, 0));

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.service.list().subscribe({
      next: (res) => {
        this.achievements.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Failed to load achievements.');
        this.loading.set(false);
      },
    });
  }

  protected save(payload: AchievementPayload): void {
    const current = this.editing();
    this.saving.set(true);
    // The award type is fixed once created, so it's left out of updates.
    const { awardType: _fixed, ...changes } = payload;
    const call = current ? this.service.update(current.id, changes) : this.service.create(payload);
    call.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.editing.set(undefined);
        const awarded = res.data?.awarded ?? 0;
        const verb = current ? 'saved' : 'created';
        this.toast.success(
          awarded ? `Achievement ${verb}. Given to ${awarded} mentor(s) who already qualify.` : `Achievement ${verb}.`,
        );
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.error(err.error?.message ?? 'Could not save the achievement.');
      },
    });
  }

  protected toggleActive(a: AdminAchievementInterface): void {
    this.busyId.set(a.id);
    this.service.update(a.id, { isActive: !a.isActive }).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success(a.isActive ? 'Achievement hidden.' : 'Achievement is active again.');
        this.load();
      },
      error: (err: HttpErrorResponse) => this.fail(err),
    });
  }

  protected evaluate(a: AdminAchievementInterface): void {
    this.busyId.set(a.id);
    this.service.evaluate(a.id).subscribe({
      next: (res) => {
        this.busyId.set(null);
        const n = res.data?.awarded ?? 0;
        this.toast.success(n ? `Given to ${n} more mentor(s).` : 'No new mentors qualify yet.');
        this.load();
      },
      error: (err: HttpErrorResponse) => this.fail(err),
    });
  }

  protected remove(a: AdminAchievementInterface): void {
    this.busyId.set(a.id);
    this.service.remove(a.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Achievement deleted.');
        this.load();
      },
      error: (err: HttpErrorResponse) => this.fail(err),
    });
  }

  protected onQueueChanged(): void {
    this.load();
  }

  protected showTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'review') this.queue()?.load();
  }

  private fail(err: HttpErrorResponse): void {
    this.busyId.set(null);
    this.toast.error(err.error?.message ?? 'Something went wrong. Please try again.');
  }
}
