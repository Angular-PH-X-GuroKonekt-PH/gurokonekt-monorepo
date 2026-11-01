import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileService } from '../../profile.service';
import { AccountActivationPage } from './account-activation.page';

describe('AccountActivationPage', () => {
  let fixture: ComponentFixture<AccountActivationPage>;
  let profileService: {
    getUserProfile: ReturnType<typeof vi.fn>;
    getActivationRequest: ReturnType<typeof vi.fn>;
    activateAccount: ReturnType<typeof vi.fn>;
  };

  const user = {
    id: 'mentor-1',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria@example.com',
    role: 'mentor',
    status: 'inactive',
  };

  const render = async (request: unknown) => {
    profileService.getActivationRequest.mockReturnValue(of({ status: 'success', data: request }));
    fixture = TestBed.createComponent(AccountActivationPage);
    fixture.detectChanges();
    // ngOnInit awaits two requests; let those promises settle before rendering.
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  };

  beforeEach(async () => {
    profileService = {
      getUserProfile: vi.fn().mockReturnValue(of({ status: 'success', data: user })),
      getActivationRequest: vi.fn(),
      activateAccount: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AccountActivationPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProfileService, useValue: profileService },
        { provide: Store, useValue: { selectSnapshot: () => user, dispatch: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('shows "waiting for approval" instead of the form when a request is pending', async () => {
    const text = await render({ status: 'pending', reason: 'Back', reviewNote: null, createdAt: '', reviewedAt: null });

    expect(text).toContain('Request submitted');
    expect(fixture.nativeElement.querySelector('#activation-reason')).toBeNull();
  });

  it("shows the admin's reason and the form again when the last request was rejected", async () => {
    const text = await render({
      status: 'rejected',
      reason: 'Back',
      reviewNote: 'Please update your profile first.',
      createdAt: '',
      reviewedAt: '',
    });

    expect(text).toContain('Your last request was not approved');
    expect(text).toContain('Please update your profile first.');
    expect(fixture.nativeElement.querySelector('#activation-reason')).not.toBeNull();
  });

  it('shows the plain form when there is no previous request', async () => {
    const text = await render(null);

    expect(text).not.toContain('Request submitted');
    expect(text).not.toContain('not approved');
    expect(fixture.nativeElement.querySelector('#activation-reason')).not.toBeNull();
  });
});
