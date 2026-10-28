import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { vi } from 'vitest';

import { PasskeySignInButtonComponent } from './passkey-sign-in-button.component';
import { PasskeyService } from '../../services/passkey.service';
import { ToastService } from '../../../../shared/services/toast.service';

describe('PasskeySignInButtonComponent', () => {
  const passkeyService = { isSupported: vi.fn(() => true), signIn: vi.fn() };
  const toast = { info: vi.fn(), errorExclusive: vi.fn() };

  const create = () => {
    TestBed.configureTestingModule({
      imports: [PasskeySignInButtonComponent],
      providers: [
        { provide: PasskeyService, useValue: passkeyService },
        { provide: ToastService, useValue: toast },
        { provide: Store, useValue: { dispatch: vi.fn(), selectSnapshot: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(PasskeySignInButtonComponent);
    const busy: boolean[] = [];
    const failed: string[] = [];
    fixture.componentInstance.busy.subscribe((value) => busy.push(value));
    fixture.componentInstance.failed.subscribe((message) => failed.push(message));
    fixture.detectChanges();
    return { fixture, busy, failed };
  };

  beforeEach(() => vi.clearAllMocks());

  it('uses the shared sign-in button style, matching the Google button', () => {
    const { fixture } = create();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.classList).toContain('auth-provider-button');
    expect(button.textContent).toContain('Sign in with a passkey');
  });

  it('reports busy while signing in and passes failures to the page', async () => {
    passkeyService.signIn.mockResolvedValue({ status: 'failed', message: "We couldn't sign you in with a passkey." });
    const { fixture, busy, failed } = create();

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    expect(busy).toEqual([true, false]);
    expect(failed).toEqual(["We couldn't sign you in with a passkey."]);
  });

  it('shows a note instead of the button on unsupported browsers', () => {
    passkeyService.isSupported.mockReturnValueOnce(false);
    const { fixture } = create();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain("isn't supported");
  });
});
