import { Component, input, output, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MenteeManagementService, MenteeListItem, MenteeDetail } from '../../../services/mentee-management.service';

@Component({
  selector: 'app-view-mentee-profile-modal',
  imports: [DatePipe],
  templateUrl: './view-mentee-profile-modal.html',
})
export class ViewMenteeProfileModalComponent {
  private readonly menteeService = inject(MenteeManagementService);

  readonly mentee = input.required<MenteeListItem>();
  readonly closed = output<void>();

  protected detail = signal<MenteeDetail | null>(null);
  protected rejectionLog = signal<{ reason: string; createdAt: string } | null>(null);
  protected isLoading = signal(true);

  constructor() {
    effect(() => {
      const m = this.mentee();
      if (!m) return;
      this.isLoading.set(true);
      this.detail.set(null);
      this.rejectionLog.set(null);

      this.menteeService.getMenteeById(m.id).subscribe({
        next: (res) => {
          this.detail.set(res.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });

      if (m.status === 'rejected') {
        this.menteeService.getRejectionLog(m.id).subscribe({
          next: (res) => this.rejectionLog.set(res.data),
          error: () => {},
        });
      }
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected getComputedStatus(mentee: MenteeListItem): string {
    if (mentee.status === 'active') return 'Active';
    if (mentee.status === 'inactive' && !mentee.isEmailVerified) return 'Not Yet Verified';
    if (mentee.status === 'inactive' && mentee.isEmailVerified) return 'Deactivated';
    if (mentee.status === 'rejected') return 'Rejected';
    return mentee.status;
  }
}
