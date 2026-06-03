import { Component, input, output, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MenteeManagementService, MenteeListItem } from '../../../services/mentee-management.service';

@Component({
  selector: 'app-deactivation-feedback-modal',
  imports: [DatePipe],
  templateUrl: './deactivation-feedback-modal.html',
})
export class DeactivationFeedbackModalComponent {
  private readonly menteeService = inject(MenteeManagementService);

  readonly mentee = input.required<MenteeListItem>();
  readonly closed = output<void>();

  protected feedback = signal<{ reason: string; createdAt: string } | null>(null);
  protected isLoading = signal(true);

  constructor() {
    effect(() => {
      const m = this.mentee();
      if (!m) return;
      this.isLoading.set(true);
      this.feedback.set(null);

      this.menteeService.getMenteeById(m.id).subscribe({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false),
      });
    });
  }

  protected close(): void {
    this.closed.emit();
  }
}
