import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AchievementAwardType, MentorAchievementStatus } from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { AchievementsAdminService } from '../../services/achievements.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ReviewQueueComponent } from './review-queue';

describe('ReviewQueueComponent', () => {
  let fixture: ComponentFixture<ReviewQueueComponent>;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  const pending = {
    id: 'rec-1',
    achievementId: 'ach-1',
    status: MentorAchievementStatus.Pending,
    details: 'MVP – Developer Technologies',
    earnedAt: '2025-07-01T00:00:00.000Z',
    awardedAt: null,
    expiresAt: '2027-06-30T00:00:00.000Z',
    proofFileName: 'mvp.pdf',
    reviewNote: null,
    reviewedAt: null,
    updatedAt: '2026-10-30T00:00:00.000Z',
    achievement: { id: 'ach-1', name: 'Microsoft MVP', icon: '🏆', color: 'blue', awardType: AchievementAwardType.Application, requiresProof: true },
    mentor: { id: 'm1', firstName: 'Maria', lastName: 'Santos', email: 'maria@example.com' },
    hasProof: true,
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === label) as HTMLButtonElement;

  beforeEach(async () => {
    service = {
      submissions: vi.fn().mockReturnValue(of({ status: 'success', data: [pending] })),
      approve: vi.fn().mockReturnValue(of({ status: 'success', data: null })),
      reject: vi.fn().mockReturnValue(of({ status: 'success', data: null })),
      revoke: vi.fn(),
      proofUrl: vi.fn().mockReturnValue(of({ status: 'success', data: { url: 'https://signed.example/proof', expiresInSeconds: 600 } })),
    };
    await TestBed.configureTestingModule({
      imports: [ReviewQueueComponent],
      providers: [
        { provide: AchievementsAdminService, useValue: service },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReviewQueueComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads applications waiting for review by default', () => {
    expect(service['submissions']).toHaveBeenCalledWith(MentorAchievementStatus.Pending);
    expect(el().textContent).toContain('Maria Santos');
    expect(el().textContent).toContain('MVP – Developer Technologies');
  });

  it('opens the proof through a short-lived link', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    button('View proof').click();

    expect(service['proofUrl']).toHaveBeenCalledWith('rec-1');
    expect(open).toHaveBeenCalledWith('https://signed.example/proof', '_blank', 'noopener');
  });

  it('approves and removes the row', () => {
    const changed = vi.fn();
    fixture.componentInstance.changed.subscribe(changed);

    button('Approve').click();
    fixture.detectChanges();

    expect(service['approve']).toHaveBeenCalledWith('rec-1');
    expect(changed).toHaveBeenCalled();
    expect(el().textContent).not.toContain('Maria Santos');
  });

  it('needs a reason to reject', () => {
    button('Reject').click();
    fixture.detectChanges();
    expect(button('Reject application').disabled).toBe(true);

    const textarea = el().querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Certificate is unreadable';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    button('Reject application').click();

    expect(service['reject']).toHaveBeenCalledWith('rec-1', 'Certificate is unreadable');
  });
});
