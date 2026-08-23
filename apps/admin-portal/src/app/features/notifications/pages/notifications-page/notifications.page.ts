import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AnnouncementSummary,
  AnnouncementTargetRole,
  NotificationsService,
} from '../../services/notifications.service';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, FormsModule],
  templateUrl: './notifications.page.html',
})
export class NotificationsPage implements OnInit {
  private readonly notificationsService = inject(NotificationsService);

  protected title = signal('');
  protected message = signal('');
  protected targetRole = signal<AnnouncementTargetRole>('all');
  protected submitting = signal(false);
  protected successMessage = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected touched = signal(false);
  protected announcements = signal<AnnouncementSummary[]>([]);
  protected loadingAnnouncements = signal(true);
  protected announcementsError = signal<string | null>(null);
  protected announcementSearch = signal('');
  protected announcementDateFrom = signal('');
  protected announcementDateTo = signal('');
  protected announcementSort = signal('createdAt:desc');
  protected announcementPage = signal(1);
  protected announcementTotal = signal(0);
  protected announcementTotalPages = signal(0);
  protected readonly announcementLimit = 10;

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  protected get isValid(): boolean {
    return this.title().trim().length > 0 && this.message().trim().length > 0;
  }

  protected onSubmit(): void {
    this.touched.set(true);
    if (!this.isValid) return;

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.notificationsService
      .broadcast({
        title: this.title().trim(),
        message: this.message().trim(),
        targetRole: this.targetRole(),
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.status === 'success') {
            const sent = res.data?.sent ?? 0;
            this.successMessage.set(
              `Announcement sent to ${sent} user${sent !== 1 ? 's' : ''}.`,
            );
            this.title.set('');
            this.message.set('');
            this.targetRole.set('all');
            this.touched.set(false);
            this.announcementPage.set(1);
            this.loadAnnouncements();
          } else {
            this.errorMessage.set(
              res.message || 'Failed to send announcement.',
            );
          }
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set(
            'An unexpected error occurred. Please try again.',
          );
        },
      });
  }

  protected loadAnnouncements(): void {
    this.loadingAnnouncements.set(true);
    this.announcementsError.set(null);

    const [sortBy, sortOrder] = this.announcementSort().split(':') as [
      'createdAt' | 'title' | 'recipientCount',
      'asc' | 'desc',
    ];
    this.notificationsService
      .listAnnouncements({
        search: this.announcementSearch().trim() || undefined,
        dateFrom: this.announcementDateFrom() || undefined,
        dateTo: this.announcementDateTo() || undefined,
        sortBy,
        sortOrder,
        page: this.announcementPage(),
        limit: this.announcementLimit,
      })
      .subscribe({
        next: (res) => {
          this.loadingAnnouncements.set(false);
          if (res.status === 'success' && res.data) {
            this.announcements.set(res.data.data);
            this.announcementTotal.set(res.data.total);
            this.announcementTotalPages.set(res.data.totalPages);
          } else {
            this.announcementsError.set(
              res.message || 'Failed to load sent announcements.',
            );
          }
        },
        error: () => {
          this.loadingAnnouncements.set(false);
          this.announcementsError.set('Failed to load sent announcements.');
        },
      });
  }

  protected updateAnnouncementSearch(value: string): void {
    this.announcementSearch.set(value);
    this.resetAnnouncementPageAndReload();
  }

  protected updateAnnouncementDateFrom(value: string): void {
    this.announcementDateFrom.set(value);
    this.resetAnnouncementPageAndReload();
  }

  protected updateAnnouncementDateTo(value: string): void {
    this.announcementDateTo.set(value);
    this.resetAnnouncementPageAndReload();
  }

  protected updateAnnouncementSort(value: string): void {
    this.announcementSort.set(value);
    this.resetAnnouncementPageAndReload();
  }

  protected changeAnnouncementPage(page: number): void {
    if (page < 1 || page > this.announcementTotalPages()) return;
    this.announcementPage.set(page);
    this.loadAnnouncements();
  }

  protected clearAnnouncementFilters(): void {
    this.announcementSearch.set('');
    this.announcementDateFrom.set('');
    this.announcementDateTo.set('');
    this.announcementSort.set('createdAt:desc');
    this.resetAnnouncementPageAndReload();
  }

  private resetAnnouncementPageAndReload(): void {
    this.announcementPage.set(1);
    this.loadAnnouncements();
  }
}
