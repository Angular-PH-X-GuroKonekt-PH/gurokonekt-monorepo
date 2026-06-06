import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationsService, AnnouncementTargetRole } from '../../services/notifications.service';

@Component({
  selector: 'app-notifications-page',
  imports: [FormsModule],
  templateUrl: './notifications.page.html',
})
export class NotificationsPage {
  private readonly notificationsService = inject(NotificationsService);

  protected title = signal('');
  protected message = signal('');
  protected targetRole = signal<AnnouncementTargetRole>('all');
  protected submitting = signal(false);
  protected successMessage = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected touched = signal(false);

  protected get isValid(): boolean {
    return this.title().trim().length > 0 && this.message().trim().length > 0;
  }

  protected onSubmit(): void {
    this.touched.set(true);
    if (!this.isValid) return;

    this.submitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.notificationsService.broadcast({
      title: this.title().trim(),
      message: this.message().trim(),
      targetRole: this.targetRole(),
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.status === 'success') {
          const sent = res.data?.sent ?? 0;
          this.successMessage.set(`Announcement sent to ${sent} user${sent !== 1 ? 's' : ''}.`);
          this.title.set('');
          this.message.set('');
          this.targetRole.set('all');
          this.touched.set(false);
        } else {
          this.errorMessage.set(res.message || 'Failed to send announcement.');
        }
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('An unexpected error occurred. Please try again.');
      },
    });
  }
}
