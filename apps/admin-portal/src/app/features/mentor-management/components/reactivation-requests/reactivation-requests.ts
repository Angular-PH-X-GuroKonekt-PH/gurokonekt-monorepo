import { Component, inject, OnInit, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  MentorManagementService,
  MentorReactivationRequest,
} from '../../services/mentor-management.service';

/**
 * Inactive mentors who asked to come back. Mentees reactivate on their own;
 * mentors wait here for an admin to approve or reject. Hidden when empty.
 */
@Component({
  selector: 'app-reactivation-requests',
  imports: [FormsModule],
  templateUrl: './reactivation-requests.html',
})
export class ReactivationRequestsComponent implements OnInit {
  private readonly mentorService = inject(MentorManagementService);

  /** Emits after a mentor's status changes, so the mentor table can refresh. */
  readonly changed = output<void>();

  protected requests = signal<MentorReactivationRequest[]>([]);
  protected loadError = signal<string | null>(null);
  protected busyId = signal<string | null>(null);
  protected rejectingId = signal<string | null>(null);
  protected rejectReason = signal('');
  protected actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.mentorService.getReactivationRequests().subscribe({
      next: (res) => this.requests.set(res.data ?? []),
      error: () => this.loadError.set('Failed to load reactivation requests.'),
    });
  }

  protected fullName(r: MentorReactivationRequest): string {
    return `${r.firstName} ${r.lastName}`.trim();
  }

  protected formatDate(iso: string | null): string {
    return iso
      ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
      : '—';
  }

  protected approve(r: MentorReactivationRequest): void {
    this.actionError.set(null);
    this.busyId.set(r.mentorId);
    this.mentorService.approveReactivation(r.mentorId).subscribe({
      next: () => this.done(r.mentorId),
      error: (err: HttpErrorResponse) => this.fail(err, 'Failed to approve the request.'),
    });
  }

  protected startReject(r: MentorReactivationRequest): void {
    this.actionError.set(null);
    this.rejectReason.set('');
    this.rejectingId.set(r.mentorId);
  }

  protected cancelReject(): void {
    this.rejectingId.set(null);
  }

  protected confirmReject(r: MentorReactivationRequest): void {
    const reason = this.rejectReason().trim();
    if (!reason) {
      this.actionError.set('Enter a reason so the mentor knows why.');
      return;
    }
    this.actionError.set(null);
    this.busyId.set(r.mentorId);
    this.mentorService.rejectReactivation(r.mentorId, reason).subscribe({
      next: () => this.done(r.mentorId),
      error: (err: HttpErrorResponse) => this.fail(err, 'Failed to reject the request.'),
    });
  }

  private done(mentorId: string): void {
    this.busyId.set(null);
    this.rejectingId.set(null);
    this.requests.update((list) => list.filter((r) => r.mentorId !== mentorId));
    this.changed.emit();
  }

  private fail(err: HttpErrorResponse, fallback: string): void {
    this.busyId.set(null);
    this.actionError.set(err.error?.message ?? fallback);
  }
}
