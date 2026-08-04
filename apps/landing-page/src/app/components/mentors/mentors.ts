import {
  Component,
  signal,
  computed,
  DestroyRef,
  inject,
  NgZone,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import {
  FeaturedMentor,
  FeaturedMentors,
} from '../../shared/services/featured-mentors/featured-mentors';

/** How many featured mentors to pull for the carousel. */
const MENTOR_LIMIT = 12;

/** Auto-advance interval, milliseconds. */
const AUTO_ADVANCE_MS = 5000;

/** Cross-fade duration between cards, milliseconds. */
const TRANSITION_MS = 300;

@Component({
  selector: 'app-mentors',
  imports: [ScrollRevealDirective, TranslatePipe],
  templateUrl: './mentors.html',
  styleUrl: './mentors.scss',
})
export class Mentors implements OnInit {
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private readonly featuredMentors = inject(FeaturedMentors);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  currentIndex = signal(0);
  isTransitioning = signal(false);

  readonly mentors = signal<FeaturedMentor[]>([]);

  /** The whole section is hidden when there is nothing to show. */
  readonly hasMentors = computed(() => this.mentors().length > 0);

  /** Navigating between fewer than two cards is meaningless. */
  readonly canNavigate = computed(() => this.mentors().length > 1);

  private autoAdvanceStarted = false;

  /**
   * Fetches in the browser only.
   *
   * Every route in this app is prerendered at build time
   * (`RenderMode.Prerender` on `**`), so a server-side fetch would bake
   * whichever mentors were featured at build time into static HTML that never
   * refreshes — defeating the admin Featured toggle. Same approach as `Hero`.
   */
  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.featuredMentors.getFeaturedMentors(MENTOR_LIMIT).subscribe((mentors) => {
      this.mentors.set(mentors);
      this.startAutoAdvance();
    });
  }

  // `currentMentor` is undefined until data arrives, and stays undefined if
  // nothing is featured. The template never renders these while the section is
  // hidden, but they must not throw in the meantime.
  currentMentor = computed<FeaturedMentor | undefined>(
    () => this.mentors()[this.currentIndex()],
  );

  fullName = computed(() => {
    const mentor = this.currentMentor();
    return mentor ? `${mentor.firstName} ${mentor.lastName}`.trim() : '';
  });

  currentMentorExpertise = computed(
    () => this.currentMentor()?.areasOfExpertise.join(', ') ?? '',
  );

  currentMentorBio = computed(() => this.currentMentor()?.bio ?? '');

  /**
   * One dot per mentor.
   *
   * This was previously three fixed dots with a rotating "active" position
   * computed from a running navigation count — a workaround for a hardcoded
   * list. With a real list the dots can simply mirror it, so the active dot is
   * just `currentIndex` and a click goes straight to that slide.
   */
  dots = computed(() => this.mentors().map((_, index) => index));

  /** Initials fallback for a mentor with no avatar, matching the hero. */
  initials(mentor: FeaturedMentor): string {
    return `${mentor.firstName.charAt(0)}${mentor.lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * The blue subtitle line. Prefers the mentor's professional title and falls
   * back to their expertise so the line is never empty.
   */
  displayTitle(mentor: FeaturedMentor): string {
    return mentor.title?.trim() || mentor.areasOfExpertise.join(', ');
  }

  /**
   * Whether to show expertise on its own line. Skipped when there is no title,
   * because `displayTitle` already fell back to expertise above.
   */
  showExpertiseLine(mentor: FeaturedMentor): boolean {
    return !!mentor.title?.trim() && mentor.areasOfExpertise.length > 0;
  }

  /**
   * Starts the carousel rotation.
   *
   * Deliberately not in the constructor: `nextSlide` divides by
   * `mentors().length`, and `% 0` on the initially empty array yields `NaN`,
   * which would corrupt `currentIndex` permanently. Only runs once, and only
   * when there is more than one card to rotate between.
   */
  private startAutoAdvance(): void {
    if (this.autoAdvanceStarted || !this.canNavigate()) return;
    this.autoAdvanceStarted = true;

    this.ngZone.runOutsideAngular(() => {
      const interval = setInterval(() => {
        this.ngZone.run(() => this.nextSlide());
      }, AUTO_ADVANCE_MS);

      this.destroyRef.onDestroy(() => clearInterval(interval));
    });
  }

  nextSlide(): void {
    this.goToSlide((this.currentIndex() + 1) % this.mentors().length);
  }

  previousSlide(): void {
    const length = this.mentors().length;
    this.goToSlide((this.currentIndex() - 1 + length) % length);
  }

  /** Fades out, swaps the card, fades back in. */
  goToSlide(index: number): void {
    if (!this.canNavigate() || index === this.currentIndex()) return;

    this.isTransitioning.set(true);
    setTimeout(() => {
      this.currentIndex.set(index);
      this.isTransitioning.set(false);
    }, TRANSITION_MS);
  }
}
