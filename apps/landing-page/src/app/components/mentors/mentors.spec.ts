import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { Mentors } from './mentors';
import {
  FeaturedMentor,
  FeaturedMentors,
} from '../../shared/services/featured-mentors/featured-mentors';

const buildMentor = (overrides: Partial<FeaturedMentor> = {}): FeaturedMentor => ({
  id: 'mentor-1',
  firstName: 'Maria',
  lastName: 'Santos',
  title: 'Senior Software Engineer',
  bio: 'Ten years building distributed systems.',
  areasOfExpertise: ['Software Engineering', 'DevOps'],
  skills: ['TypeScript'],
  avatarUrl: 'https://cdn.test/maria.png',
  averageRating: 4.9,
  ratingCount: 27,
  ...overrides,
});

describe('Mentors', () => {
  let fixture: ComponentFixture<Mentors>;
  let getFeaturedMentors: ReturnType<typeof vi.fn>;

  async function setup(mentors: FeaturedMentor[], platform: object = 'browser') {
    getFeaturedMentors = vi.fn(() => of(mentors));

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Mentors],
      providers: [
        { provide: FeaturedMentors, useValue: { getFeaturedMentors } },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Mentors);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const section = (el: HTMLElement) =>
    el.querySelector('[data-testid="mentors-section"]');

  afterEach(() => vi.useRealTimers());

  it('should create', async () => {
    await setup([buildMentor()]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('requests twelve mentors', async () => {
    await setup([]);
    expect(getFeaturedMentors).toHaveBeenCalledWith(12);
  });

  describe('empty state', () => {
    // Nothing is featured by default, so this is the day-one state — the whole
    // section must disappear rather than render an empty carousel.
    it('renders nothing at all when no mentors are featured', async () => {
      const el = await setup([]);

      expect(section(el)).toBeNull();
      expect(el.textContent?.trim()).toBe('');
    });

    // The service maps failures to [], so an outage looks the same as "none".
    it('renders nothing when the request failed', async () => {
      const el = await setup([]);
      expect(section(el)).toBeNull();
    });
  });

  describe('with mentors', () => {
    it('shows the name, title, expertise, bio and rating', async () => {
      const el = await setup([buildMentor()]);

      expect(section(el)).toBeTruthy();
      expect(el.textContent).toContain('Maria Santos');
      expect(el.textContent).toContain('Senior Software Engineer');
      expect(el.textContent).toContain('Software Engineering, DevOps');
      expect(el.textContent).toContain('Ten years building distributed systems.');
      expect(el.textContent).toContain('4.9');
    });

    it('renders the avatar with the mentor name as alt text', async () => {
      const el = await setup([buildMentor()]);

      const img = el.querySelector<HTMLImageElement>('img[alt="Maria Santos"]');
      expect(img?.getAttribute('src')).toBe('https://cdn.test/maria.png');
    });

    it('falls back to initials when the mentor has no avatar', async () => {
      const el = await setup([buildMentor({ avatarUrl: null })]);

      expect(
        el.querySelector('[data-testid="mentor-initials"]')?.textContent?.trim(),
      ).toBe('MS');
      expect(el.querySelector('img[alt="Maria Santos"]')).toBeNull();
    });

    it('hides the rating for a mentor with no reviews', async () => {
      const el = await setup([
        buildMentor({ averageRating: null, ratingCount: 0 }),
      ]);

      expect(el.querySelector('[data-testid="mentor-rating"]')).toBeNull();
      expect(el.textContent).not.toContain('null');
      expect(el.textContent).not.toContain('Rating 0');
    });

    it('omits the bio paragraph when there is no bio', async () => {
      const el = await setup([buildMentor({ bio: null })]);

      expect(el.textContent).toContain('Maria Santos');
      expect(el.textContent).not.toContain('Ten years building');
    });

    // displayTitle falls back to expertise, so showing it again would duplicate.
    it('falls back to expertise when the mentor has no title', async () => {
      const el = await setup([buildMentor({ title: null })]);

      const occurrences = (
        el.textContent?.match(/Software Engineering, DevOps/g) ?? []
      ).length;
      expect(occurrences).toBe(1);
    });
  });

  describe('navigation', () => {
    it('hides the controls when there is only one mentor', async () => {
      const el = await setup([buildMentor()]);

      expect(el.querySelector('[data-testid="mentors-next"]')).toBeNull();
      expect(el.querySelector('[data-testid="mentors-prev"]')).toBeNull();
    });

    it('shows the controls when there is more than one mentor', async () => {
      const el = await setup([
        buildMentor({ id: 'a' }),
        buildMentor({ id: 'b', firstName: 'Jose', lastName: 'Rizal' }),
      ]);

      expect(el.querySelector('[data-testid="mentors-next"]')).toBeTruthy();
      expect(el.querySelector('[data-testid="mentors-prev"]')).toBeTruthy();
    });

    // Previously three fixed dots regardless of how many mentors existed.
    it('renders one dot per mentor', async () => {
      const el = await setup([
        buildMentor({ id: 'a' }),
        buildMentor({ id: 'b' }),
        buildMentor({ id: 'c' }),
        buildMentor({ id: 'd' }),
        buildMentor({ id: 'e' }),
      ]);

      expect(el.querySelectorAll('[aria-label^="Go to mentor"]')).toHaveLength(5);
    });

    it('marks the current mentor’s dot as active', async () => {
      const el = await setup([
        buildMentor({ id: 'a' }),
        buildMentor({ id: 'b' }),
        buildMentor({ id: 'c' }),
      ]);

      const active = el.querySelectorAll('[aria-current="true"]');
      expect(active).toHaveLength(1);
      expect(active[0].getAttribute('aria-label')).toBe('Go to mentor 1 of 3');
    });

    it('jumps straight to the clicked dot', async () => {
      vi.useFakeTimers();
      await setup([
        buildMentor({ id: 'a' }),
        buildMentor({ id: 'b' }),
        buildMentor({ id: 'c' }),
      ]);
      const instance = fixture.componentInstance as any;

      instance.goToSlide(2);
      vi.advanceTimersByTime(300);

      expect(instance.currentIndex()).toBe(2);
    });

    it('advances and wraps from the last mentor to the first', async () => {
      vi.useFakeTimers();
      await setup([
        buildMentor({ id: 'a' }),
        buildMentor({ id: 'b' }),
        buildMentor({ id: 'c' }),
      ]);
      const instance = fixture.componentInstance as any;

      instance.nextSlide();
      vi.advanceTimersByTime(300);
      expect(instance.currentIndex()).toBe(1);

      instance.nextSlide();
      vi.advanceTimersByTime(300);
      instance.nextSlide();
      vi.advanceTimersByTime(300);
      expect(instance.currentIndex()).toBe(0);
    });

    it('wraps backwards from the first mentor to the last', async () => {
      vi.useFakeTimers();
      await setup([buildMentor({ id: 'a' }), buildMentor({ id: 'b' })]);
      const instance = fixture.componentInstance as any;

      instance.previousSlide();
      vi.advanceTimersByTime(300);

      expect(instance.currentIndex()).toBe(1);
    });

    // nextSlide does `% mentors().length`; with one mentor there is nothing to
    // rotate to, and with zero it would be `% 0` → NaN.
    it('does not auto-advance with a single mentor', async () => {
      vi.useFakeTimers();
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

      await setup([buildMentor()]);

      expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    it('starts auto-advancing with more than one mentor', async () => {
      vi.useFakeTimers();
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

      await setup([buildMentor({ id: 'a' }), buildMentor({ id: 'b' })]);

      expect(setIntervalSpy).toHaveBeenCalled();
    });
  });

  // Every route here is prerendered; fetching on the server would bake
  // build-time mentors into static HTML that never refreshes.
  it('does not fetch when rendering on the server', async () => {
    const el = await setup([buildMentor()], 'server');

    expect(getFeaturedMentors).not.toHaveBeenCalled();
    expect(section(el)).toBeNull();
  });
});
