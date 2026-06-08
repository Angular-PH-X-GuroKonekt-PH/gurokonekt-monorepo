import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReportsService, OverviewReport, SessionsReport, MentorsReport } from '../../services/reports.service';

@Component({
  selector: 'app-reports-page',
  imports: [DecimalPipe],
  templateUrl: './reports.page.html',
})
export class ReportsPage implements OnInit {
  private readonly reportsService = inject(ReportsService);

  protected overview = signal<OverviewReport | null>(null);
  protected sessions = signal<SessionsReport | null>(null);
  protected mentors = signal<MentorsReport | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    let completed = 0;
    const done = () => { if (++completed === 3) this.loading.set(false); };

    this.reportsService.getOverview().subscribe({
      next: (res) => { if (res.status === 'success') this.overview.set(res.data); done(); },
      error: () => { this.error.set('Failed to load reports.'); done(); },
    });

    this.reportsService.getSessions().subscribe({
      next: (res) => { if (res.status === 'success') this.sessions.set(res.data); done(); },
      error: () => { this.error.set('Failed to load reports.'); done(); },
    });

    this.reportsService.getMentors().subscribe({
      next: (res) => { if (res.status === 'success') this.mentors.set(res.data); done(); },
      error: () => { this.error.set('Failed to load reports.'); done(); },
    });
  }

  protected objectKeys(obj: Record<string, number>): string[] {
    return Object.keys(obj);
  }
}
