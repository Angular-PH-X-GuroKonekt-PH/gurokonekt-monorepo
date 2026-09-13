import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingCardInterface } from '@gurokonekt/models/interfaces/booking/booking.model';

@Component({
  selector: 'app-approve-booking-modal',
  imports: [FormsModule],
  templateUrl: './approve-booking-modal.html',
})
export class ApproveBookingModal {
  booking = input.required<BookingCardInterface>();
  submitting = input(false);
  displayTimezone = input('UTC');

  sessionDate = model('');
  sessionTime = model('');
  sessionLink = model('');
  mentorNotes = model('');

  protected readonly approvalAttempted = signal(false);
  protected readonly isSessionLinkInvalid = computed(
    () => this.approvalAttempted() && !this.sessionLink().trim(),
  );

  closed = output<void>();
  confirmed = output<void>();

  protected confirmApproval(): void {
    this.approvalAttempted.set(true);

    if (this.isSessionLinkInvalid()) {
      return;
    }

    this.confirmed.emit();
  }
}
