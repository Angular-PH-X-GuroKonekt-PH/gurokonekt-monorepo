import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MentorManagementService } from '../../services/mentor-management.service';
import { ReactivationRequestsComponent } from './reactivation-requests';

describe('ReactivationRequestsComponent', () => {
  let fixture: ComponentFixture<ReactivationRequestsComponent>;
  let service: {
    getReactivationRequests: ReturnType<typeof vi.fn>;
    approveReactivation: ReturnType<typeof vi.fn>;
    rejectReactivation: ReturnType<typeof vi.fn>;
  };

  const request = {
    mentorId: 'mentor-1',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria@example.com',
    reactivationReason: 'Ready to mentor again',
    deactivationReason: 'Taking a break',
    deactivatedAt: '2026-10-01T00:00:00.000Z',
    requestedAt: '2026-10-30T00:00:00.000Z',
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === label) as HTMLButtonElement;

  const render = async (requests: unknown[]) => {
    service.getReactivationRequests.mockReturnValue(of({ status: 'success', data: requests }));
    fixture = TestBed.createComponent(ReactivationRequestsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    service = {
      getReactivationRequests: vi.fn(),
      approveReactivation: vi.fn().mockReturnValue(of({ status: 'success', data: { status: 'approved' } })),
      rejectReactivation: vi.fn().mockReturnValue(of({ status: 'success', data: null })),
    };
    await TestBed.configureTestingModule({
      imports: [ReactivationRequestsComponent],
      providers: [{ provide: MentorManagementService, useValue: service }],
    }).compileComponents();
  });

  it('renders nothing when there are no requests', async () => {
    await render([]);
    expect(el().textContent?.trim()).toBe('');
  });

  it('shows the mentor with why they left and why they are returning', async () => {
    await render([request]);
    expect(el().textContent).toContain('Maria Santos');
    expect(el().textContent).toContain('Ready to mentor again');
    expect(el().textContent).toContain('Taking a break');
  });

  it('approves a request, removes it, and tells the page to refresh', async () => {
    await render([request]);
    const changed = vi.fn();
    fixture.componentInstance.changed.subscribe(changed);

    button('Approve').click();
    fixture.detectChanges();

    expect(service.approveReactivation).toHaveBeenCalledWith('mentor-1');
    expect(changed).toHaveBeenCalled();
    expect(el().textContent).not.toContain('Maria Santos');
  });

  it('requires a reason before rejecting', async () => {
    await render([request]);
    button('Reject').click();
    fixture.detectChanges();

    button('Reject request').click();
    fixture.detectChanges();
    expect(service.rejectReactivation).not.toHaveBeenCalled();
    expect(el().textContent).toContain('Enter a reason');

    const textarea = el().querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Please update your profile first.';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    button('Reject request').click();
    fixture.detectChanges();

    expect(service.rejectReactivation).toHaveBeenCalledWith('mentor-1', 'Please update your profile first.');
  });
});
