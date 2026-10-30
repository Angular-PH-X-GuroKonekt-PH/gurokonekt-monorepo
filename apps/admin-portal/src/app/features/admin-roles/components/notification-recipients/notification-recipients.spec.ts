import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminRolesService } from '../../services/admin-roles.service';
import { NotificationRecipientsComponent } from './notification-recipients';

describe('NotificationRecipientsComponent', () => {
  let fixture: ComponentFixture<NotificationRecipientsComponent>;
  let service: {
    getNotificationRecipients: ReturnType<typeof vi.fn>;
    addNotificationRecipient: ReturnType<typeof vi.fn>;
    removeNotificationRecipient: ReturnType<typeof vi.fn>;
  };

  const existing = { id: 'r1', email: 'admin@example.com', createdAt: '2026-10-29T00:00:00.000Z' };

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const typeEmail = async (value: string) => {
    const input = fixture.nativeElement.querySelector('input[name="email"]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const submit = async () => {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    service = {
      getNotificationRecipients: vi.fn().mockReturnValue(of({ status: 'success', data: [existing] })),
      addNotificationRecipient: vi.fn(),
      removeNotificationRecipient: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationRecipientsComponent],
      providers: [{ provide: AdminRolesService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationRecipientsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('lists the configured emails', () => {
    expect(text()).toContain('admin@example.com');
  });

  it('adds a new email to the list', async () => {
    service.addNotificationRecipient.mockReturnValue(
      of({ status: 'success', data: { id: 'r2', email: 'ops@example.com', createdAt: '' } }),
    );

    await typeEmail(' Ops@Example.com ');
    await submit();

    expect(service.addNotificationRecipient).toHaveBeenCalledWith('ops@example.com');
    expect(text()).toContain('ops@example.com');
  });

  it('rejects an invalid email without calling the API', async () => {
    await typeEmail('not-an-email');
    await submit();

    expect(service.addNotificationRecipient).not.toHaveBeenCalled();
    expect(text()).toContain('Enter a valid email address.');
  });

  it('shows the API error when adding fails', async () => {
    service.addNotificationRecipient.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'This email is already on the notification list' } })),
    );

    await typeEmail('ops@example.com');
    await submit();

    expect(text()).toContain('This email is already on the notification list');
  });

  it('removes an email from the list', async () => {
    service.removeNotificationRecipient.mockReturnValue(of({ status: 'success', data: null }));

    const removeButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((b) => b.textContent?.includes('Remove')) as HTMLButtonElement;
    removeButton.click();
    fixture.detectChanges();

    expect(service.removeNotificationRecipient).toHaveBeenCalledWith('r1');
    expect(text()).not.toContain('admin@example.com');
    expect(text()).toContain('No emails added yet');
  });
});
