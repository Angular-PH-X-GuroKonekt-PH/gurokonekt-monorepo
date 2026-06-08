import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  MentorManagementService,
  MentorListItem,
  MentorsQueryParams,
} from '../../services/mentor-management.service';
import { ViewMentorProfileModalComponent } from '../modals/view-mentor-profile-modal/view-mentor-profile-modal';
import { RejectMentorModalComponent } from '../modals/reject-mentor-modal/reject-mentor-modal';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'inactive';

@Component({
  selector: 'app-mentor-table',
  imports: [DatePipe, ViewMentorProfileModalComponent, RejectMentorModalComponent],
  templateUrl: './mentor-table.html',
})
export class MentorTableComponent implements OnInit, OnDestroy {
  private readonly mentorService = inject(MentorManagementService);
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  // Data
  protected mentors = signal<MentorListItem[]>([]);
  protected isLoading = signal(false);
  protected total = signal(0);
  protected totalPages = signal(0);
  protected page = signal(1);
  protected readonly limit = 20;

  // Filters
  protected statusFilter = signal<StatusFilter>('all');
  protected search = signal('');
  protected dateFrom = signal('');
  protected dateTo = signal('');

  // Dropdown
  protected openDropdownId = signal<string | null>(null);
  protected submitting = signal(false);

  // Inline confirm
  protected confirmAction = signal<{ mentorId: string; type: 'approve' | 'deactivate' } | null>(null);

  // Modal state
  protected selectedMentor = signal<MentorListItem | null>(null);
  protected showViewModal = signal(false);
  protected showRejectModal = signal(false);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((value) => {
      this.search.set(value);
      this.page.set(1);
      this.loadMentors();
    });
  }

  ngOnInit(): void {
    this.loadMentors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected loadMentors(): void {
    this.isLoading.set(true);
    const params: MentorsQueryParams = {
      status: this.statusFilter(),
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: this.page(),
      limit: this.limit,
      ...(this.search() && { search: this.search() }),
      ...(this.dateFrom() && { dateFrom: this.dateFrom() }),
      ...(this.dateTo() && { dateTo: this.dateTo() }),
    };

    this.mentorService.getMentors(params).subscribe({
      next: (res) => {
        if (res.data) {
          this.mentors.set(res.data.data);
          this.total.set(res.data.total);
          this.totalPages.set(res.data.totalPages);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected onStatusFilterChange(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadMentors();
  }

  protected onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  protected onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.page.set(1);
    this.loadMentors();
  }

  protected onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.page.set(1);
    this.loadMentors();
  }

  protected onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadMentors();
  }

  // Dropdown
  protected toggleDropdown(id: string, event: Event): void {
    event.stopPropagation();
    this.openDropdownId.set(this.openDropdownId() === id ? null : id);
  }

  protected closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  // Status display helpers
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

  protected isPending(status: string): boolean {
    return status === 'pending_approval' || status === 'pending_review';
  }

  // Action openers
  protected openViewProfile(mentor: MentorListItem): void {
    this.selectedMentor.set(mentor);
    this.showViewModal.set(true);
    this.closeDropdown();
  }

  protected openReject(mentor: MentorListItem): void {
    this.selectedMentor.set(mentor);
    this.showRejectModal.set(true);
    this.closeDropdown();
  }

  protected openConfirm(mentor: MentorListItem, type: 'approve' | 'deactivate'): void {
    this.selectedMentor.set(mentor);
    this.confirmAction.set({ mentorId: mentor.id, type });
    this.closeDropdown();
  }

  // Modal close handlers
  protected closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedMentor.set(null);
  }

  protected closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedMentor.set(null);
  }

  protected cancelConfirm(): void {
    this.confirmAction.set(null);
    this.selectedMentor.set(null);
  }

  // Action executors
  protected executeConfirm(): void {
    const action = this.confirmAction();
    if (!action) return;
    this.submitting.set(true);
    const call = action.type === 'approve'
      ? this.mentorService.approveMentor(action.mentorId)
      : this.mentorService.deactivateMentor(action.mentorId);

    call.subscribe({
      next: () => { this.submitting.set(false); this.cancelConfirm(); this.loadMentors(); },
      error: () => this.submitting.set(false),
    });
  }

  protected onRejectConfirmed(reason: string): void {
    const mentor = this.selectedMentor();
    if (!mentor) return;
    this.submitting.set(true);
    this.mentorService.rejectMentor(mentor.id, reason).subscribe({
      next: () => { this.submitting.set(false); this.closeRejectModal(); this.loadMentors(); },
      error: () => this.submitting.set(false),
    });
  }

  protected getConfirmMessage(type: 'approve' | 'deactivate'): string {
    return type === 'approve'
      ? 'Approve this mentor application?'
      : 'Deactivate this mentor account?';
  }
}
