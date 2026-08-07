import { Component, computed, input, output, signal } from '@angular/core';
import { BookingCardInterface, CreateReviewRequest } from '@gurokonekt/models';
import { REVIEW_MAX_LENGTH, REVIEW_RATING_OPTIONS } from '../../../constants/review.constants';
import { IconComponent } from "../../../../../shared/components/icon/icon.component";

@Component({
  selector: 'app-mentee-review-modal',
  imports: [IconComponent],
  templateUrl: './mentee-review-modal.html',
})
export class MenteeReviewModal {


  booking = input.required<BookingCardInterface>();
  isSubmitting = input(false);

  closeModal = output<void>();
  submitReview = output<CreateReviewRequest>();

  protected readonly ratingOptions = REVIEW_RATING_OPTIONS;
  protected readonly maxCommentLength = REVIEW_MAX_LENGTH;

  protected readonly rating = signal(5);
  protected readonly comment = signal('');


  protected readonly mentorName = computed(()=>{
    const mentor = this.booking().mentor;
    return mentor ? `${mentor.firstName} ${mentor.lastName}` : 'this mentor';
  });

  protected setRating(rating: number): void {
    this.rating.set(rating);
  }

  protected onCommentInput(event: Event):void {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  protected onSubmit(): void {
    this.submitReview.emit({
      bookingId: this.booking().id,
      rating: this.rating(),
      comment: this.comment() || undefined,
    });
  }









}
