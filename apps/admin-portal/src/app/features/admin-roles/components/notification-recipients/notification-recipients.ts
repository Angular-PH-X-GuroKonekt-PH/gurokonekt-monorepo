import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminRolesService, NotificationRecipient } from '../../services/admin-roles.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails that get an alert when a new mentor registers and needs approval. */
@Component({
  selector: 'app-notification-recipients',
  imports: [FormsModule],
  templateUrl: './notification-recipients.html',
})
export class NotificationRecipientsComponent implements OnInit {
  private readonly adminRolesService = inject(AdminRolesService);

  protected recipients = signal<NotificationRecipient[]>([]);
  protected loading = signal(true);
  protected loadError = signal<string | null>(null);

  protected email = signal('');
  protected adding = signal(false);
  protected removingId = signal<string | null>(null);
  protected actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.adminRolesService.getNotificationRecipients().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'success' && res.data) {
          this.recipients.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Failed to load email recipients.');
      },
    });
  }

  protected add(): void {
    const email = this.email().trim().toLowerCase();
    this.actionError.set(null);

    if (!EMAIL_PATTERN.test(email)) {
      this.actionError.set('Enter a valid email address.');
      return;
    }
    if (this.recipients().some((r) => r.email === email)) {
      this.actionError.set('This email is already on the list.');
      return;
    }

    this.adding.set(true);
    this.adminRolesService.addNotificationRecipient(email).subscribe({
      next: (res) => {
        this.adding.set(false);
        if (res.status === 'success' && res.data) {
          this.recipients.update((list) => [...list, res.data as NotificationRecipient]);
          this.email.set('');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.adding.set(false);
        this.actionError.set(err.error?.message ?? 'Failed to add email.');
      },
    });
  }

  protected remove(recipient: NotificationRecipient): void {
    this.actionError.set(null);
    this.removingId.set(recipient.id);
    this.adminRolesService.removeNotificationRecipient(recipient.id).subscribe({
      next: () => {
        this.removingId.set(null);
        this.recipients.update((list) => list.filter((r) => r.id !== recipient.id));
      },
      error: (err: HttpErrorResponse) => {
        this.removingId.set(null);
        this.actionError.set(err.error?.message ?? 'Failed to remove email.');
      },
    });
  }
}
