import {
  Component,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import {
  FEATURED_MENTORS_HERO_COUNT,
  FeaturedMentor,
  FeaturedMentors,
} from '../../shared/services/featured-mentors/featured-mentors';

/**
 * Percentage insets reconstructing the original `hero.png` composite, which
 * baked the astronaut, both mentor photos, and both rating badges into one flat
 * image. Index 0 is the large upper circle, index 1 the smaller lower one.
 *
 * Derived by eye from the source PNG — close and responsive, but not
 * pixel-identical to the original artwork.
 */
const MENTOR_SLOTS = [
  {
    photo: 'left-[23%] top-[1%] w-[37.6%]',
    badge: 'left-[8.7%] top-[1.2%] w-[25.6%]',
    badgeFill: 'bg-orange-500 text-white',
  },
  {
    photo: 'left-[52.6%] top-[28%] w-[29.3%]',
    badge: 'left-[73.8%] top-[21.5%] w-[25%]',
    badgeFill: 'bg-orange-200 text-gray-900',
  },
] as const;

@Component({
  selector: 'app-hero',
  imports: [ScrollRevealDirective, TranslatePipe, RouterLink],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly featuredMentors = inject(FeaturedMentors);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly signInUrl = this.appConfig.SIGN_IN_URL;

  protected readonly mentors = signal<FeaturedMentor[]>([]);

  /**
   * True when there is nothing to show — no featured mentors, or the request
   * failed (the service maps errors to an empty array). Both cases fall back to
   * the original static image so a backend problem can never break the page.
   */
  protected readonly showFallback = computed(() => this.mentors().length === 0);

  protected readonly slots = MENTOR_SLOTS;

  /**
   * Fetches in the browser only.
   *
   * Every route in this app is prerendered at build time
   * (`RenderMode.Prerender` on `**` in `app.routes.server.ts`), so a fetch on
   * the server would bake whichever mentors were featured at build time into
   * static HTML — they would then never change until the next deploy, which
   * would defeat the admin Featured toggle entirely.
   *
   * Instead the prerendered HTML ships the static fallback and the browser
   * swaps in live mentors after hydration.
   */
  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.featuredMentors
      .getFeaturedMentors(FEATURED_MENTORS_HERO_COUNT)
      .subscribe((mentors) =>
        this.mentors.set(mentors.slice(0, MENTOR_SLOTS.length)),
      );
  }

  protected fullName(mentor: FeaturedMentor): string {
    return `${mentor.firstName} ${mentor.lastName}`.trim();
  }

  protected initials(mentor: FeaturedMentor): string {
    return `${mentor.firstName.charAt(0)}${mentor.lastName.charAt(0)}`.toUpperCase();
  }
}
