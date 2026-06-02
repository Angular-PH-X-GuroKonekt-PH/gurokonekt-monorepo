import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MenteeManagementService, MenteeListItem, MenteesQueryParams } from '../../services/mentee-management.service';

@Component({
  selector: 'app-mentee-table',
  imports: [DatePipe],
  templateUrl: './mentee-table.html',
})
export class MenteeTableComponent implements OnInit {
  private readonly menteeService = inject(MenteeManagementService);

  protected mentees = signal<MenteeListItem[]>([]);
  protected isLoading = signal(false);
  protected total = signal(0);
  protected totalPages = signal(0);

  protected statusFilter = signal<'active' | 'inactive' | 'all'>('all');
  protected sortBy = signal<'createdAt' | 'firstName' | 'lastName'>('createdAt');
  protected sortOrder = signal<'asc' | 'desc'>('desc');
  protected page = signal(1);
  protected readonly limit = 20;

  ngOnInit(): void {
    this.loadMentees();
  }

  protected loadMentees(): void {
    this.isLoading.set(true);
    const params: MenteesQueryParams = {
      status: this.statusFilter(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
      page: this.page(),
      limit: this.limit,
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

  protected onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadMentees();
  }

  protected getDisplayStatus(mentee: MenteeListItem): string {
    if (mentee.status === 'active') return 'Active';
    if (mentee.status === 'inactive' && !mentee.isEmailVerified) return 'Not Verified';
    if (mentee.status === 'inactive' && mentee.isEmailVerified) return 'Deactivated';
    if (mentee.status === 'rejected') return 'Rejected';
    return mentee.status;
  }
}
