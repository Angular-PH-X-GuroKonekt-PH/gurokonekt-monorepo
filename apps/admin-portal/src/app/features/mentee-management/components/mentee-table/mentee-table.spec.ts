// mentee-table.spec.ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { MenteeTableComponent } from './mentee-table';
import { MenteeManagementService } from '../../services/mentee-management.service';

const mockPaginatedResponse = {
  data: { data: [], total: 0, totalPages: 0 },
};

const mockService = {
  getMentees: vi.fn(() => of(mockPaginatedResponse)),
  getMenteeById: vi.fn(() => of({ data: null })),
  activateMentee: vi.fn(() => of({ data: null })),
  deactivateMentee: vi.fn(() => of({ data: null })),
  rejectMentee: vi.fn(() => of({ data: null })),
  resendVerification: vi.fn(() => of({ data: null })),
  getRejectionLog: vi.fn(() => of({ data: null })),
};

describe('MenteeTableComponent — search', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [MenteeTableComponent],
      providers: [{ provide: MenteeManagementService, useValue: mockService }],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(MenteeTableComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('creates the component', () => {
    expect(createComponent().componentInstance).toBeTruthy();
  });

  it('ngOnInit calls loadMentees on initialization', () => {
    createComponent();
    expect(mockService.getMentees).toHaveBeenCalledTimes(1);
  });

  it('search signal initializes to empty string', () => {
    const instance = createComponent().componentInstance as any;
    expect(instance.search()).toBe('');
  });

  it('onSearchChange updates search signal and resets page to 1', () => {
    const instance = createComponent().componentInstance as any;
    instance.page.set(3);
    instance.onSearchChange('john');
    expect(instance.search()).toBe('john');
    expect(instance.page()).toBe(1);
  });

  it('loadMentees includes trimmed search in params when search is non-empty', () => {
    const instance = createComponent().componentInstance as any;
    instance.search.set('  john  ');
    instance.loadMentees();
    expect(mockService.getMentees).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'john' }),
    );
  });

  it('loadMentees omits search from params when search is empty string', () => {
    const instance = createComponent().componentInstance as any;
    instance.search.set('');
    instance.loadMentees();
    const lastCall = (mockService.getMentees as ReturnType<typeof vi.fn>).mock.calls.at(-1)[0];
    expect(lastCall).not.toHaveProperty('search');
  });

  it('loadMentees omits search from params when search is only whitespace', () => {
    const instance = createComponent().componentInstance as any;
    instance.search.set('   ');
    instance.loadMentees();
    const lastCall = (mockService.getMentees as ReturnType<typeof vi.fn>).mock.calls.at(-1)[0];
    expect(lastCall).not.toHaveProperty('search');
  });

  it('clearSearch resets search to empty string, resets page to 1, and reloads', () => {
    const instance = createComponent().componentInstance as any;
    instance.search.set('john');
    instance.page.set(3);
    const callsBefore = (mockService.getMentees as ReturnType<typeof vi.fn>).mock.calls.length;
    instance.clearSearch();
    expect(instance.search()).toBe('');
    expect(instance.page()).toBe(1);
    expect((mockService.getMentees as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore + 1);
  });
});
