// inquiry-table.spec.ts
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { InquiryTableComponent } from './inquiry-table';
import {
  InquiryListItem,
  UserInquiriesService,
} from '../../services/user-inquiries.service';
import { ToastService } from '../../../../shared/services/toast.service';

const buildInquiry = (overrides: Partial<InquiryListItem> = {}): InquiryListItem => ({
  id: 'inquiry-1',
  fullName: 'Maria Santos',
  email: 'maria@example.com',
  topic: 'Becoming a mentor',
  message: 'I would like to know how to apply as a mentor.',
  createdAt: '2026-08-03T14:25:37.000Z',
  ...overrides,
});

const emptyPage = { data: { data: [], total: 0, totalPages: 0 } };

const mockService = {
  getInquiries: vi.fn(() => of(emptyPage)),
};

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

describe('InquiryTableComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockService.getInquiries.mockReturnValue(of(emptyPage));

    await TestBed.configureTestingModule({
      imports: [InquiryTableComponent],
      providers: [
        { provide: UserInquiriesService, useValue: mockService },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();
  });

  type Internals = Record<string, any>;

  function createComponent() {
    const fixture = TestBed.createComponent(InquiryTableComponent);
    fixture.detectChanges();
    return {
      fixture,
      instance: fixture.componentInstance as unknown as Internals,
      el: fixture.nativeElement as HTMLElement,
    };
  }

  function withInquiries(rows: InquiryListItem[]) {
    mockService.getInquiries.mockReturnValue(
      of({ data: { data: rows, total: rows.length, totalPages: 1 } }),
    );
    return createComponent();
  }

  it('loads inquiries on init', () => {
    createComponent();
    expect(mockService.getInquiries).toHaveBeenCalledTimes(1);
  });

  it('defaults to newest first', () => {
    createComponent();
    const params = mockService.getInquiries.mock.calls[0][0];
    expect(params.sortBy).toBe('createdAt');
    expect(params.sortOrder).toBe('desc');
  });

  it('renders a row per inquiry', () => {
    const { el } = withInquiries([
      buildInquiry({ id: 'a' }),
      buildInquiry({ id: 'b', fullName: 'Jose Rizal' }),
    ]);

    expect(el.querySelectorAll('[data-testid="inquiry-row"]')).toHaveLength(2);
    expect(el.textContent).toContain('Maria Santos');
    expect(el.textContent).toContain('Jose Rizal');
  });

  it('shows an empty state when there are no inquiries', () => {
    const { el } = createComponent();

    expect(el.querySelector('[data-testid="inquiries-empty"]')).toBeTruthy();
    expect(el.querySelectorAll('[data-testid="inquiry-row"]')).toHaveLength(0);
  });

  it('cycles sort ascending then descending then off', () => {
    const { instance } = createComponent();

    instance['onSort']('fullName');
    expect(instance['sortBy']()).toBe('fullName');
    expect(instance['sortOrder']()).toBe('asc');

    instance['onSort']('fullName');
    expect(instance['sortOrder']()).toBe('desc');

    instance['onSort']('fullName');
    expect(instance['sortBy']()).toBeNull();
  });

  it('resets to page 1 when sorting changes', () => {
    const { instance } = createComponent();
    instance['page'].set(4);

    instance['onSort']('email');

    expect(instance['page']()).toBe(1);
  });

  it('refetches when the page changes', () => {
    const { instance } = createComponent();
    mockService.getInquiries.mockClear();

    instance['onPageChange'](2);

    expect(mockService.getInquiries.mock.calls[0][0].page).toBe(2);
  });

  it('toggles the expanded message', () => {
    const { instance } = withInquiries([buildInquiry()]);

    expect(instance['expandedId']()).toBeNull();
    instance['toggleExpanded']('inquiry-1');
    expect(instance['expandedId']()).toBe('inquiry-1');
    instance['toggleExpanded']('inquiry-1');
    expect(instance['expandedId']()).toBeNull();
  });

  it('shows a toast when loading fails', () => {
    mockService.getInquiries.mockReturnValue(throwError(() => new Error('boom')));

    const { instance } = createComponent();

    expect(mockToast.error).toHaveBeenCalled();
    expect(instance['isLoading']()).toBe(false);
  });
});
