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

  protected detail = signal<MentorDetail | null>(null);
  protected rejectionLog = signal<MentorRejectionLog | null>(null);
  protected deactivationFeedback = signal<MentorDeactivationFeedback | null | undefined>(undefined);
  protected isLoading = signal(true);

  constructor() {
    effect(() => {
      const m = this.mentor();
      if (!m) return;
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
