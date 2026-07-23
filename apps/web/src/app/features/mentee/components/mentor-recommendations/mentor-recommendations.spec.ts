import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MentorSearchItemInterface } from '@gurokonekt/models/interfaces/search/search.model';
import { RecommendedMentorsState } from '../../interfaces/search-mentor.interface';
import { MentorRecommendations } from './mentor-recommendations';

const buildMentor = (id = 'mentor-1'): MentorSearchItemInterface => ({
  id,
  firstName: 'Mentor',
  middleName: null,
  lastName: id,
  suffix: null,
  email: `${id}@example.com`,
  country: 'PH',
  timezone: 'Asia/Manila',
  language: 'English',
  isMentorApproved: true,
  isMentorProfileComplete: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  avatarAttachments: [],
  mentorProfiles: [
    {
      id: `${id}-profile`,
      title: 'Engineer',
      areasOfExpertise: ['Web Development'],
      yearsOfExperience: 5,
      bio: 'A mentor bio',
      skills: ['TypeScript'],
      sessionRate: 50,
      availability: [],
      linkedInUrl: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ],
});

const buildState = (
  overrides: Partial<RecommendedMentorsState> = {},
): RecommendedMentorsState => ({
  mentors: [],
  isPersonalized: false,
  isLoading: false,
  error: null,
  ...overrides,
});

describe('MentorRecommendations', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MentorRecommendations],
      providers: [provideRouter([])],
    });
  });

  const render = (state: RecommendedMentorsState) => {
    const fixture = TestBed.createComponent(MentorRecommendations);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the personalized heading when isPersonalized is true', () => {
    const el = render(
      buildState({ isPersonalized: true, mentors: [buildMentor()] }),
    );
    expect(el.textContent).toContain('Recommended for you');
    expect(el.textContent).toContain('Based on your goals and interests');
  });

  it('shows the featured heading when isPersonalized is false', () => {
    const el = render(
      buildState({ isPersonalized: false, mentors: [buildMentor()] }),
    );
    expect(el.textContent).toContain('Featured mentors');
    expect(el.textContent).toContain('Popular mentors on Gurokonekt');
  });

  it('renders the error message when the request failed', () => {
    const el = render(buildState({ error: 'Unable to load recommendations.' }));
    expect(el.textContent).toContain('Unable to load recommendations.');
  });

  it('shows the skeleton and heading while loading', () => {
    const el = render(buildState({ isLoading: true }));
    expect(el.querySelector('app-mentor-card-list-skeleton')).toBeTruthy();
    expect(el.textContent).toContain('Featured mentors');
  });

  it('renders nothing when not loading, no error, and no mentors', () => {
    const el = render(buildState());
    expect(el.querySelector('section')).toBeNull();
    expect(el.textContent?.trim()).toBe('');
  });
});
