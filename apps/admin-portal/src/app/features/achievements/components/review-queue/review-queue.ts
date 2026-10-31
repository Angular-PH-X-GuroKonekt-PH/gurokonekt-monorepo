import { Component, OnInit, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  AchievementAwardType,
  AdminAchievementSubmissionInterface,
  MentorAchievementStatus,
} from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { AchievementsAdminService } from '../../services/achievements.service';
import { STATUS_LABELS, badgeClasses, formatDate } from '../../badge-styles';
import { ToastService } from '../../../../shared/services/toast.service';

type Action = 'reject' | 'revoke';

@Component({
  selector: 'app-review-queue',
  imports: [FormsModule],
  templateUrl: './review-queue.html',
})
export class ReviewQueueComponent implements OnInit {
  private readonly service = inject(AchievementsAdminService);
  private readonly toast = inject(ToastService);

  /** Emits after any change so the page can refresh counts. */
  readonly changed = output<void>();

  protected readonly Status = MentorAchievementStatus;
  protected readonly AwardType = AchievementAwardType;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly badgeClasses = badgeClasses;
  protected readonly formatDate = formatDate;
  protected readonly filters: { value: MentorAchievementStatus | ''; label: string }[] = [
    { value: MentorAchievementStatus.Pending, label: 'Waiting for review' },
    { value: MentorAchievementStatus.Approved, label: 'Approved' },
    { value: MentorAchievementStatus.Rejected, label: 'Rejected' },
    { value: MentorAchievementStatus.Expired, label: 'Expired' },
    { value: MentorAchievementStatus.Revoked, label: 'Revoked' },
    { value: '', label: 'All' },
  ];

  protected filter = signal<MentorAchievementStatus | ''>(MentorAchievementStatus.Pending);
  protected rows = signal<AdminAchievementSubmissionInterface[]>([]);
  protected loading = signal(true);
  protected loadError = signal<string | null>(null);
  protected busyId = signal<string | null>(null);
  protected reasonFor = signal<{ id: string; action: Action } | null>(null);
  protected reason = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.submissions(this.filter() || undefined).subscribe({
      next: (res) => {
        this.rows.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Failed to load applications.');
        this.loading.set(false);
      },
    });
  }

  protected setFilter(value: MentorAchievementStatus | ''): void {
    this.filter.set(value);
    this.reasonFor.set(null);
    this.load();
  }

  protected viewProof(row: AdminAchievementSubmissionInterface): void {
    this.service.proofUrl(row.id).subscribe({
      next: (res) => {
        if (res.data?.url) window.open(res.data.url, '_blank', 'noopener');
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message ?? 'Could not open the proof file.'),
    });
  }

  protected approve(row: AdminAchievementSubmissionInterface): void {
    this.busyId.set(row.id);
    this.service.approve(row.id).subscribe({
      next: () => this.done(row, `${row.achievement.name} approved for ${row.mentor.firstName}.`),
      error: (err: HttpErrorResponse) => this.fail(err),
    });
  }

  protected askReason(row: AdminAchievementSubmissionInterface, action: Action): void {
    this.reason.set('');
    this.reasonFor.set({ id: row.id, action });
  }

  protected confirmReason(row: AdminAchievementSubmissionInterface): void {
    const pending = this.reasonFor();
    const reason = this.reason().trim();
    if (!pending || !reason) return;
    this.busyId.set(row.id);
    const call = pending.action === 'reject' ? this.service.reject(row.id, reason) : this.service.revoke(row.id, reason);
    call.subscribe({
      next: () => this.done(row, pending.action === 'reject' ? 'Application rejected.' : 'Badge revoked.'),
      error: (err: HttpErrorResponse) => this.fail(err),
    });
  }

  private done(row: AdminAchievementSubmissionInterface, message: string): void {
    this.busyId.set(null);
    this.reasonFor.set(null);
    this.toast.success(message);
    this.rows.update((list) => list.filter((r) => r.id !== row.id));
    this.changed.emit();
  }

  private fail(err: HttpErrorResponse): void {
    this.busyId.set(null);
    this.toast.error(err.error?.message ?? 'Something went wrong. Please try again.');
  }
}
