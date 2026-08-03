import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Hero } from './hero';
import { APP_CONFIG } from '../../../environments/app-config.token';
import { environment } from '../../../environments/environment';
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
  areasOfExpertise: ['Software Engineering'],
  skills: ['TypeScript'],
  avatarUrl: 'https://cdn.test/maria.png',
  averageRating: 4.9,
  ratingCount: 27,
  ...overrides,
});

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  let getFeaturedMentors: ReturnType<typeof vi.fn>;

  async function setup(mentors: FeaturedMentor[]) {
    getFeaturedMentors = vi.fn(() => of(mentors));

    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
        provideRouter([]),
        { provide: FeaturedMentors, useValue: { getFeaturedMentors } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => TestBed.resetTestingModule());

  const mentorEls = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('[data-testid="hero-mentor"]'));

  it('should create', async () => {
    await setup([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('requests two mentors', async () => {
    await setup([]);
    expect(getFeaturedMentors).toHaveBeenCalledWith(2);
  });

  // Every route is prerendered at build time, so a server-side fetch would bake
  // build-time mentors into static HTML that never refreshes.
  it('does not fetch when rendering on the server', async () => {
    getFeaturedMentors = vi.fn(() => of([]));

    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
        provideRouter([]),
        { provide: FeaturedMentors, useValue: { getFeaturedMentors } },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();

    const serverFixture = TestBed.createComponent(Hero);
    serverFixture.detectChanges();

    expect(getFeaturedMentors).not.toHaveBeenCalled();
    expect(
      (serverFixture.nativeElement as HTMLElement).querySelector(
        'img[src="hero.png"]',
      ),
    ).toBeTruthy();
  });

  describe('fallback', () => {
    it('renders the static hero image when no mentors are returned', async () => {
      const el = await setup([]);

      expect(el.querySelector('img[src="hero.png"]')).toBeTruthy();
      expect(mentorEls(el)).toHaveLength(0);
    });

    // The service maps failures to [], so an outage is indistinguishable from
    // "no featured mentors" — both must show the static image, never an error.
    it('renders the static hero image when the request failed', async () => {
      const el = await setup([]);

      expect(el.querySelector('img[src="hero.png"]')).toBeTruthy();
    });
  });

  describe('with mentors', () => {
    it('renders both mentors and drops the static image', async () => {
      const el = await setup([
        buildMentor({ id: 'a' }),
        buildMentor({ id: 'b', firstName: 'Jose', lastName: 'Rizal' }),
      ]);

      expect(mentorEls(el)).toHaveLength(2);
      expect(el.querySelector('img[src="hero.png"]')).toBeNull();
    });

    it('uses the avatar url and the mentor name as alt text', async () => {
      const el = await setup([buildMentor()]);

      const img = el.querySelector<HTMLImageElement>(
        '[data-testid="hero-mentor"] img',
      );
      expect(img?.getAttribute('src')).toBe('https://cdn.test/maria.png');
      expect(img?.getAttribute('alt')).toBe('Maria Santos');
    });

    it('renders a single mentor without reserving an empty slot', async () => {
      const el = await setup([buildMentor()]);

      expect(mentorEls(el)).toHaveLength(1);
    });

    it('falls back to initials when the mentor has no avatar', async () => {
      const el = await setup([buildMentor({ avatarUrl: null })]);

      const mentor = mentorEls(el)[0];
      expect(mentor.querySelector('img')).toBeNull();
      expect(mentor.textContent).toContain('MS');
    });

    it('shows the rating when one exists', async () => {
      const el = await setup([buildMentor({ averageRating: 4.9 })]);

      expect(el.textContent).toContain('4.9');
      expect(el.textContent).toContain('Rating');
    });

    it('omits the rating label for an unrated mentor', async () => {
      const el = await setup([
        buildMentor({ averageRating: null, ratingCount: 0 }),
      ]);

      expect(el.textContent).toContain('Maria Santos');
      expect(el.textContent).not.toContain('Rating');
    });
  });
});
