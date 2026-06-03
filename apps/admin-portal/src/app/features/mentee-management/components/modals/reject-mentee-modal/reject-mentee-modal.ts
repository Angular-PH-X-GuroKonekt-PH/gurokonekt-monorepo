import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenteeListItem } from '../../../services/mentee-management.service';

@Component({
  selector: 'app-reject-mentee-modal',
  imports: [FormsModule],
  templateUrl: './reject-mentee-modal.html',
})
export class RejectMenteeModalComponent {
  readonly mentee = input.required<MenteeListItem>();
  readonly submitting = input<boolean>(false);
  readonly confirmed = output<string>();
  readonly closed = output<void>();

  protected reason = signal('');
  protected touched = signal(false);

  protected get isValid(): boolean {
    return this.reason().trim().length >= 10;
  }

  protected onConfirm(): void {
    this.touched.set(true);
    if (!this.isValid) return;
    this.confirmed.emit(this.reason().trim());
  }

  protected close(): void {
    this.reason.set('');
    this.touched.set(false);
    this.closed.emit();
  }
}
