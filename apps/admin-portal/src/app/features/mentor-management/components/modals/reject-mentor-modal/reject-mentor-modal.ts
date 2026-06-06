import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MentorListItem } from '../../../services/mentor-management.service';

@Component({
  selector: 'app-reject-mentor-modal',
  imports: [FormsModule],
  templateUrl: './reject-mentor-modal.html',
})
export class RejectMentorModalComponent {
  readonly mentor = input.required<MentorListItem>();
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
