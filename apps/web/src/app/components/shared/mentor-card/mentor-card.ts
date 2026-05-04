import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserAvailabilityInterface } from '@gurokonekt/models/interfaces/user/user.model';

@Component({
  selector: 'app-mentor-card',
  imports: [CommonModule],
  templateUrl: './mentor-card.html',
  styleUrl: './mentor-card.scss',
})
export class MentorCard {
  uid          = input.required<string>();
  fullName     = input.required<string>();
  tagline      = input<string>('');
  bio          = input<string>('');
  avatarUrl    = input<string>('');
  rating       = input<number>(0);
  reviewCount  = input<number>(0);
  hourlyRate   = input<number | null>(null);
  skills       = input<string[]>([]);
  availability = input<UserAvailabilityInterface[]>([]);

  visibleSkills   = computed(() => this.skills().slice(0, 4));
  extraSkillCount = computed(() => Math.max(0, this.skills().length - 4));

  stars = computed(() => {
    const r = Math.round(this.rating());
    return Array.from({ length: 5 }, (_, i) => i < r ? 'full' : 'empty');
  });

  availabilityLabel = computed(() => {
    const firstAvailability = this.availability()[0];

    if (!firstAvailability) {
      return '';
    }

    const firstTimeFrame = firstAvailability.timeFrames?.[0];
    const day = this.capitalize(firstAvailability.day);

    if (!firstTimeFrame) {
      return day;
    }

    return `${day} - ${this.formatTo12Hour(firstTimeFrame.from)}`;
  });

  private readonly router = inject(Router);

  bookSession(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/book', this.uid()]);
  }

  viewProfile(): void {
    this.router.navigate(['/mentors', this.uid()]);
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatTo12Hour(time: string): string {
    const [hourStr, minute] = time.split(':');
    const hour = Number(hourStr);

    if (Number.isNaN(hour) || !minute) {
      return time;
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 || 12;

    return `${normalizedHour}:${minute} ${period}`;
  }
}
