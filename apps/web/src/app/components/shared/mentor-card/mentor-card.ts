import { Component, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
  availability = input<string>('');

  visibleSkills   = computed(() => this.skills().slice(0, 4));
  extraSkillCount = computed(() => Math.max(0, this.skills().length - 4));

  stars = computed(() => {
    const r = Math.round(this.rating());
    return Array.from({ length: 5 }, (_, i) => i < r ? 'full' : 'empty');
  });

  private readonly router = inject(Router);

  bookSession(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/book', this.uid()]);
  }

  viewProfile(): void {
    this.router.navigate(['/mentors', this.uid()]);
  }
}