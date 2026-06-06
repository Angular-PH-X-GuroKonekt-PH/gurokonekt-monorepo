import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenteeManagementService, MenteeListItem, MenteesQueryParams } from '../../services/mentee-management.service';
import { ViewMenteeProfileModalComponent } from '../modals/view-mentee-profile-modal/view-mentee-profile-modal';
import { RejectMenteeModalComponent } from '../modals/reject-mentee-modal/reject-mentee-modal';
import { DeactivationFeedbackModalComponent } from '../modals/deactivation-feedback-modal/deactivation-feedback-modal';

export type ComputedStatus = 'active' | 'not-verified' | 'deactivated' | 'rejected' | 'other';

@Component({
  selector: 'app-mentee-table',
  imports: [DatePipe, ViewMenteeProfileModalComponent, RejectMenteeModalComponent, DeactivationFeedbackModalComponent],
  templateUrl: './mentee-table.html',
})
export class MenteeTableComponent implements OnInit {
  private readonly menteeService = inject(MenteeManagementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<void>();

  // Data
  protected mentees = signal<MenteeListItem[]>([]);
  protected isLoading = signal(false);
  protected total = signal(0);
  protected totalPages = signal(0);
  protected page = signal(1);
  protected readonly limit = 20;

  // Filters
  protected statusFilter = signal<'active' | 'inactive' | 'all'>('all');
  protected dateFrom = signal('');
  protected dateTo = signal('');
  protected search = signal('');

  // Dropdown
  protected openDropdownId = signal<string | null>(null);
  protected submitting = signal(false);

  // Modal state
  protected selectedMentee = signal<MenteeListItem | null>(null);
  protected showProfileModal = signal(false);
  protected showRejectModal = signal(false);
  protected showFeedbackModal = signal(false);
  protected confirmAction = signal<'activate' | 'deactivate' | 'resend' | null>(null);

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadMentees());
    this.loadMentees();
  }

  protected loadMentees(): void {
    this.isLoading.set(true);
    const params: MenteesQueryParams = {
      status: this.statusFilter(),
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: this.page(),
      limit: this.limit,
      ...(this.dateFrom() && { dateFrom: this.dateFrom() }),
      ...(this.dateTo() && { dateTo: this.dateTo() }),
      ...(this.search().trim() && { search: this.search().trim() }),
    };

    this.menteeService.getMentees(params).subscribe({
      next: (res) => {
        if (res.data) {
          this.mentees.set(res.data.data);
          this.total.set(res.data.total);
          this.totalPages.set(res.data.totalPages);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected onStatusFilterChange(status: 'active' | 'inactive' | 'all'): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadMentees();
  }

  protected onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.page.set(1);
    this.loadMentees();
  }

  protected onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.page.set(1);
    this.loadMentees();
  }

  protected onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.searchSubject.next();
  }

  protected clearSearch(): void {
    this.search.set('');
    this.page.set(1);
    this.loadMentees();
  }

  protected onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadMentees();
  }

  // Dropdown
  protected toggleDropdown(id: string, event: Event): void {
    event.stopPropagation();
    this.openDropdownId.set(this.openDropdownId() === id ? null : id);
  }

  protected closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  // Status helpers
  protected getComputedStatus(mentee: MenteeListItem): ComputedStatus {
    if (mentee.status === 'active') return 'active';
    if (mentee.status === 'inactive' && !mentee.isEmailVerified) return 'not-verified';
    if (mentee.status === 'inactive' && mentee.isEmailVerified) return 'deactivated';
    if (mentee.status === 'rejected') return 'rejected';
    return 'other';
  }

  protected getStatusLabel(status: ComputedStatus): string {
    const labels: Record<ComputedStatus, string> = {
      'active': 'Active',
      'not-verified': 'Not Yet Verified',
      'deactivated': 'Deactivated',
      'rejected': 'Rejected',
      'other': 'Unknown',
    };
    return labels[status];
  }

  protected getStatusClass(status: ComputedStatus): string {
    const classes: Record<ComputedStatus, string> = {
      'active': 'bg-green-50 text-green-700',
      'not-verified': 'bg-yellow-50 text-yellow-700',
      'deactivated': 'bg-gray-100 text-gray-600',
      'rejected': 'bg-red-50 text-red-700',
      'other': 'bg-gray-100 text-gray-500',
    };
    return classes[status];
  }

  // Action openers
  protected openViewProfile(mentee: MenteeListItem): void {
    this.selectedMentee.set(mentee);
    this.showProfileModal.set(true);
    this.closeDropdown();
  }

  protected openReject(mentee: MenteeListItem): void {
    this.selectedMentee.set(mentee);
    this.showRejectModal.set(true);
    this.closeDropdown();
  }

  protected openFeedback(mentee: MenteeListItem): void {
    this.selectedMentee.set(mentee);
    this.showFeedbackModal.set(true);
    this.closeDropdown();
  }

  protected openConfirm(mentee: MenteeListItem, action: 'activate' | 'deactivate' | 'resend'): void {
    this.selectedMentee.set(mentee);
    this.confirmAction.set(action);
    this.closeDropdown();
  }

  // Modal close handlers
  protected closeProfileModal(): void {
    this.showProfileModal.set(false);
    this.selectedMentee.set(null);
  }

  protected closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedMentee.set(null);
  }

  protected closeFeedbackModal(): void {
    this.showFeedbackModal.set(false);
    this.selectedMentee.set(null);
  }

  protected cancelConfirm(): void {
    this.confirmAction.set(null);
    this.selectedMentee.set(null);
  }

  // Action executors
  protected confirmActivate(): void {
    const mentee = this.selectedMentee();
    if (!mentee) return;
    this.submitting.set(true);
    this.menteeService.activateMentee(mentee.id).subscribe({
      next: () => { this.submitting.set(false); this.cancelConfirm(); this.loadMentees(); },
      error: () => this.submitting.set(false),
    });
  }

  protected confirmDeactivate(): void {
    const mentee = this.selectedMentee();
    if (!mentee) return;
    this.submitting.set(true);
    this.menteeService.deactivateMentee(mentee.id).subscribe({
      next: () => { this.submitting.set(false); this.cancelConfirm(); this.loadMentees(); },
      error: () => this.submitting.set(false),
    });
  }

  protected confirmResend(): void {
    const mentee = this.selectedMentee();
    if (!mentee) return;
    this.submitting.set(true);
    this.menteeService.resendVerification(mentee.id).subscribe({
      next: () => { this.submitting.set(false); this.cancelConfirm(); this.loadMentees(); },
      error: () => this.submitting.set(false),
    });
  }

  protected onRejectConfirmed(reason: string): void {
    const mentee = this.selectedMentee();
    if (!mentee) return;
    this.submitting.set(true);
    this.menteeService.rejectMentee(mentee.id, reason).subscribe({
      next: () => { this.submitting.set(false); this.closeRejectModal(); this.loadMentees(); },
      error: () => this.submitting.set(false),
    });
  }

  protected getConfirmMessage(action: 'activate' | 'deactivate' | 'resend'): string {
    const messages = {
      activate: 'Bypass-activate this mentee account?',
      deactivate: 'Deactivate this mentee account?',
      resend: 'Resend verification email to this mentee?',
    };
    return messages[action];
  }
}
