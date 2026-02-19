import { Component, signal, computed, DestroyRef, inject, NgZone } from '@angular/core';
import { MentorCardInterface } from '@gurokonekt/models';

@Component({
  selector: 'app-mentors',
  imports: [],
  templateUrl: './mentors.html',
  styleUrl: './mentors.scss',
})
export class Mentors {
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);

  currentIndex = signal(0);
  navigationCount = signal(0);
  isTransitioning = signal(false);
  readonly VISIBLE_DOTS = 3;

  mentors = signal<MentorCardInterface[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      areasOfExpertise: ['Software Engineering', 'DevOps'],
      rating: 4.9,
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      areasOfExpertise: ['UX Design'],
      rating: 4.8,
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=800&fit=crop'
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      areasOfExpertise: ['Data Science'],
      rating: 4.95,
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=800&fit=crop'
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Williams',
      areasOfExpertise: ['Product Management'],
      rating: 4.85,
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=800&fit=crop'
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Brown',
      areasOfExpertise: ['DevOps'],
      rating: 4.92,
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=800&fit=crop'
    },
    {
      id: '6',
      firstName: 'Emily',
      lastName: 'Chen',
      areasOfExpertise: ['Mobile Development'],
      rating: 4.88,
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
      avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=800&fit=crop'
    },
    {
      id: '7',
      firstName: 'Alice',
      lastName: 'Monroe',
      areasOfExpertise: ['AI/ML Engineering'],
      rating: 4.91,
      bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=800&fit=crop'
    }
  ]);

  currentMentor = computed(() => this.mentors()[this.currentIndex()]);

  fullName = computed(() => `${this.currentMentor().firstName} ${this.currentMentor().lastName}`);

  activeDotPosition = computed(() => {
    return this.navigationCount() % this.VISIBLE_DOTS;
  });

  dots = Array.from({ length: this.VISIBLE_DOTS }, (_, i) => i);

  constructor() {
    this.ngZone.runOutsideAngular(() => {
      const interval = setInterval(() => {
        this.ngZone.run(() => this.nextSlide());
      }, 5000);

      this.destroyRef.onDestroy(() => clearInterval(interval));
    });
  }

  nextSlide(): void {
    this.isTransitioning.set(true);
    setTimeout(() => {
      this.currentIndex.update(index => (index + 1) % this.mentors().length);
      this.navigationCount.update(count => count + 1);
      this.isTransitioning.set(false);
    }, 300);
  }

  previousSlide(): void {
    this.isTransitioning.set(true);
    setTimeout(() => {
      this.currentIndex.update(index =>
        index === 0 ? this.mentors().length - 1 : index - 1
      );
      this.navigationCount.update(count => count - 1);
      this.isTransitioning.set(false);
    }, 300);
  }

  goToSlide(index: number): void {
    const current = this.currentIndex();
    const diff = index - current;

    this.currentIndex.set(index);
    this.navigationCount.update(count => count + diff);
  }

  onDotClick(dotPosition: number): void {
    const currentDotPos = this.activeDotPosition();
    let diff = dotPosition - currentDotPos;

    if (diff > this.VISIBLE_DOTS / 2) {
      diff -= this.VISIBLE_DOTS;
    } else if (diff < -this.VISIBLE_DOTS / 2) {
      diff += this.VISIBLE_DOTS;
    }

    for (let i = 0; i < Math.abs(diff); i++) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.previousSlide();
      }
    }
  }
}