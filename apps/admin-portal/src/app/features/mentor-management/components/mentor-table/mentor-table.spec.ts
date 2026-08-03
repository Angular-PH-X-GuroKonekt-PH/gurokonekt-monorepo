// mentor-table.spec.ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MentorTableComponent } from './mentor-table';
import {
  MentorListItem,
  MentorManagementService,
} from '../../services/mentor-management.service';
import { ToastService } from '../../../../shared/services/toast.service';

/** An approved mentor with a complete profile — the only featurable state. */
const buildMentor = (overrides: Partial<MentorListItem> = {}): MentorListItem => ({
  id: 'mentor-1',
  firstName: 'Maria',
  middleName: null,
  lastName: 'Santos',
  email: 'maria@test.com',
  status: 'approved',
  isMentorApproved: true,
  isMentorProfileComplete: true,
  isProfileComplete: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  avatarUrl: null,
  isFeatured: false,
  featuredAt: null,
  ...overrides,
});

const mockPaginatedResponse = {
  data: { data: [], total: 0, totalPages: 0 },
};

const mockService = {
  getMentors: vi.fn(() => of(mockPaginatedResponse)),
  getMentor: vi.fn(() => of({ data: null })),
  approveMentor: vi.fn(() => of({ data: null })),
  rejectMentor: vi.fn(() => of({ data: null })),
  deactivateMentor: vi.fn(() => of({ data: null })),
  getRejectionLog: vi.fn(() => of({ data: null })),
  getDeactivationFeedback: vi.fn(() => of({ data: null })),
  setFeatured: vi.fn(() => of({ data: null })),
};

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

describe('MentorTableComponent — featured toggle', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockService.getMentors.mockReturnValue(of(mockPaginatedResponse));
    mockService.setFeatured.mockReturnValue(of({ data: null }));

    await TestBed.configureTestingModule({
      imports: [MentorTableComponent],
      providers: [
        { provide: MentorManagementService, useValue: mockService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();
  });

  /**
   * The members under test are `protected`, so reach them through an indexed
   * view rather than sprinkling `as any` across every case.
   */
  type TableInternals = Record<string, any>;

  function createComponent(): TableInternals {
    const fixture = TestBed.createComponent(MentorTableComponent);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as TableInternals;
  }

  function withMentors(mentors: MentorListItem[]): TableInternals {
    const instance = createComponent();
    instance['mentors'].set(mentors);
    return instance;
  }

  describe('canBeFeatured', () => {
    it('is true for an approved mentor with a complete profile', () => {
      const instance = createComponent();
      expect(instance.canBeFeatured(buildMentor())).toBe(true);
    });

    it('is false for a rejected mentor', () => {
      const instance = createComponent();
      expect(instance.canBeFeatured(buildMentor({ status: 'rejected' }))).toBe(false);
    });

    it('is false for an inactive mentor', () => {
      const instance = createComponent();
      expect(instance.canBeFeatured(buildMentor({ status: 'inactive' }))).toBe(false);
    });

    it('is false when the mentor profile is incomplete', () => {
      const instance = createComponent();
      expect(
        instance.canBeFeatured(buildMentor({ isMentorProfileComplete: false })),
      ).toBe(false);
    });

    it('is false when the mentor is not approved', () => {
      const instance = createComponent();
      expect(instance.canBeFeatured(buildMentor({ isMentorApproved: false }))).toBe(
        false,
      );
    });
  });

  describe('onToggleFeatured', () => {
    it('flips the row optimistically and calls the service', () => {
      const mentor = buildMentor();
      const instance = withMentors([mentor]);

      instance.onToggleFeatured(mentor);

      expect(instance.mentors()[0].isFeatured).toBe(true);
      expect(mockService.setFeatured).toHaveBeenCalledWith('mentor-1', true);
    });

    it('shows a success toast on success', () => {
      const mentor = buildMentor();
      const instance = withMentors([mentor]);

      instance.onToggleFeatured(mentor);

      expect(mockToast.success).toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('reverts the row and shows an error toast when the request fails', () => {
      mockService.setFeatured.mockReturnValue(
        throwError(() => new Error('boom')),
      );
      const mentor = buildMentor();
      const instance = withMentors([mentor]);

      instance.onToggleFeatured(mentor);

      expect(instance.mentors()[0].isFeatured).toBe(false);
      expect(mockToast.error).toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('clears the in-flight marker after the request settles', () => {
      const mentor = buildMentor();
      const instance = withMentors([mentor]);

      instance.onToggleFeatured(mentor);

      expect(instance.featuringId()).toBeNull();
    });

    it('un-features an already-featured mentor', () => {
      const mentor = buildMentor({ isFeatured: true, featuredAt: '2026-08-01T00:00:00.000Z' });
      const instance = withMentors([mentor]);

      instance.onToggleFeatured(mentor);

      expect(instance.mentors()[0].isFeatured).toBe(false);
      expect(mockService.setFeatured).toHaveBeenCalledWith('mentor-1', false);
    });

    it('refuses to feature a mentor who is not eligible', () => {
      const mentor = buildMentor({ status: 'rejected' });
      const instance = withMentors([mentor]);

      instance.onToggleFeatured(mentor);

      expect(mockService.setFeatured).not.toHaveBeenCalled();
      expect(instance.mentors()[0].isFeatured).toBe(false);
    });

    it('still allows un-featuring a mentor who has lost eligibility', () => {
      const mentor = buildMentor({ status: 'inactive', isFeatured: true });
      const instance = withMentors([mentor]);

      instance.onToggleFeatured(mentor);

      expect(mockService.setFeatured).toHaveBeenCalledWith('mentor-1', false);
      expect(instance.mentors()[0].isFeatured).toBe(false);
    });

    it('does not reload the list on success, preserving the current page', () => {
      const mentor = buildMentor();
      const instance = withMentors([mentor]);
      mockService.getMentors.mockClear();

      instance.onToggleFeatured(mentor);

      expect(mockService.getMentors).not.toHaveBeenCalled();
    });
  });

  describe('featured filter', () => {
    it('omits isFeatured from the query when the filter is "all"', () => {
      const instance = createComponent();
      mockService.getMentors.mockClear();

      instance.onFeaturedFilterChange('all');

      const params = mockService.getMentors.mock.calls[0][0];
      expect(params.isFeatured).toBeUndefined();
    });

    it('sends isFeatured=true when filtering to featured', () => {
      const instance = createComponent();
      mockService.getMentors.mockClear();

      instance.onFeaturedFilterChange('featured');

      expect(mockService.getMentors.mock.calls[0][0].isFeatured).toBe(true);
    });

    it('sends isFeatured=false when filtering to not-featured', () => {
      const instance = createComponent();
      mockService.getMentors.mockClear();

      instance.onFeaturedFilterChange('not-featured');

      expect(mockService.getMentors.mock.calls[0][0].isFeatured).toBe(false);
    });

    it('resets to page 1 when the filter changes', () => {
      const instance = createComponent();
      instance.page.set(4);

      instance.onFeaturedFilterChange('featured');

      expect(instance.page()).toBe(1);
    });
  });
});
