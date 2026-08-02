import { Component, input, output, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  MentorManagementService,
  MentorListItem,
  MentorDetail,
  MentorRejectionLog,
  MentorDeactivationFeedback,
} from '../../../services/mentor-management.service';

@Component({
  selector: 'app-view-mentor-profile-modal',
  imports: [DatePipe],
  templateUrl: './view-mentor-profile-modal.html',
})
export class ViewMentorProfileModalComponent {
  private readonly mentorService = inject(MentorManagementService);

  readonly mentor = input.required<MentorListItem>();
  readonly closed = output<void>();
  /**
   * Requests a featured-status change. The modal deliberately does not call the
   * service itself — the table owns the optimistic update, revert, and toast, so
   * both surfaces share one code path.
   */
  readonly featuredChange = output<string>();
  /** True while the table has a featured request in flight for this mentor. */
  readonly isFeaturing = input(false);

  protected detail = signal<MentorDetail | null>(null);
  protected rejectionLog = signal<MentorRejectionLog | null>(null);
  protected deactivationFeedback = signal<MentorDeactivationFeedback | null | undefined>(undefined);
  protected isLoading = signal(true);

  /**
   * The mentor row is live, so its identity changes whenever the table patches
   * it (e.g. a featured toggle). Track the loaded id so those patches do not
   * trigger a redundant detail refetch.
   */
  private loadedMentorId: string | null = null;

  constructor() {
    effect(() => {
      const m = this.mentor();
      if (!m || m.id === this.loadedMentorId) return;
      this.loadedMentorId = m.id;
      this.isLoading.set(true);
      this.detail.set(null);
      this.rejectionLog.set(null);
      this.deactivationFeedback.set(undefined);

      this.mentorService.getMentor(m.id).subscribe({
        next: (res) => {
          this.detail.set(res.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });

      if (m.status === 'rejected') {
        this.mentorService.getRejectionLog(m.id).subscribe(
          (res) => this.rejectionLog.set(res.data)
        );
      }

      if (m.status === 'inactive') {
        this.mentorService.getDeactivationFeedback(m.id).subscribe(
          (res) => this.deactivationFeedback.set(res.data)
        );
      }
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  /** Mirrors the backend's eligibility rule; see MentorTableComponent. */
  protected canBeFeatured(mentor: MentorListItem): boolean {
    return (
      mentor.status === 'approved' &&
      mentor.isMentorApproved &&
      mentor.isMentorProfileComplete
    );
  }

  protected onToggleFeatured(): void {
    this.featuredChange.emit(this.mentor().id);
  }

  protected getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending_approval: 'Pending',
      pending_review: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      inactive: 'Inactive',
    };
    return labels[status] ?? status;
  }

  protected getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      pending_approval: 'bg-yellow-50 text-yellow-700',
      pending_review: 'bg-yellow-50 text-yellow-700',
      approved: 'bg-green-50 text-green-700',
      rejected: 'bg-red-50 text-red-700',
      inactive: 'bg-gray-100 text-gray-600',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-500';
  }
}
