import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AchievementAwardType,
  AchievementMetric,
  MentorAchievementStatus,
} from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { AchievementsService } from '../../achievements.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ProfileAchievementsSectionPage } from './profile-achievements-section.page';

const achievement = (overrides: Record<string, unknown>) => ({
  id: 'ach',
  name: 'Badge',
  description: 'desc',
  icon: '🏆',
  color: 'blue',
  awardType: AchievementAwardType.Application,
  requirements: null,
  requiresProof: true,
  autoApprove: false,
  criteria: [],
  validityMonths: null,
  isActive: true,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const mine = (overrides: Record<string, unknown>) => ({
  id: 'rec',
  achievementId: 'ach',
  status: MentorAchievementStatus.Approved,
  details: null,
  earnedAt: null,
  awardedAt: '2026-10-01T00:00:00.000Z',
  expiresAt: null,
  proofFileName: null,
  reviewNote: null,
  reviewedAt: null,
  updatedAt: '',
  ...overrides,
});

describe('ProfileAchievementsSectionPage', () => {
  let fixture: ComponentFixture<ProfileAchievementsSectionPage>;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  const el = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === label) as HTMLButtonElement;
  const render = async (items: unknown[]) => {
    service['getCatalog'].mockReturnValue(of({ status: 'success', data: items }));
    fixture = TestBed.createComponent(ProfileAchievementsSectionPage);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    service = {
      getCatalog: vi.fn(),
      submit: vi.fn().mockReturnValue(of({ status: 'success', message: 'Your application has been submitted for review', data: {} })),
      withdraw: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ProfileAchievementsSectionPage],
      providers: [
        { provide: AchievementsService, useValue: service },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('shows only approved, unexpired badges under "What mentees see"', async () => {
    await render([
      { achievement: achievement({ id: 'a', name: 'Microsoft MVP' }), mine: mine({ achievementId: 'a' }), progress: [] },
      { achievement: achievement({ id: 'b', name: 'Pending One' }), mine: mine({ achievementId: 'b', status: MentorAchievementStatus.Pending }), progress: [] },
      { achievement: achievement({ id: 'c', name: 'Old One' }), mine: mine({ achievementId: 'c', expiresAt: '2020-01-01T00:00:00.000Z' }), progress: [] },
    ]);

    const preview = el().querySelector('app-mentor-badges')!.textContent!;
    expect(preview).toContain('Microsoft MVP');
    expect(preview).not.toContain('Pending One');
    expect(preview).not.toContain('Old One');
  });

  it('shows progress towards automatic achievements', async () => {
    await render([
      {
        achievement: achievement({ name: '50 Sessions', awardType: AchievementAwardType.Automatic }),
        mine: null,
        progress: [{ metric: AchievementMetric.CompletedSessions, current: 12, min: 50, met: false }],
      },
    ]);

    expect(el().textContent).toContain('Given automatically when you reach:');
    expect(el().textContent).toContain('12 / 50');
    expect(button('Apply')).toBeUndefined();
  });

  it('shows the admin reason and lets the mentor resubmit after a rejection', async () => {
    await render([
      {
        achievement: achievement({ name: 'Microsoft MVP' }),
        mine: mine({ status: MentorAchievementStatus.Rejected, reviewNote: 'Certificate is unreadable' }),
        progress: [],
      },
    ]);

    expect(el().textContent).toContain('Certificate is unreadable');
    expect(button('Update and resubmit')).toBeTruthy();
  });

  it('asks for proof before submitting a new application', async () => {
    await render([{ achievement: achievement({ name: 'Microsoft MVP' }), mine: null, progress: [] }]);

    button('Apply').click();
    fixture.detectChanges();
    button('Submit').click();
    fixture.detectChanges();

    expect(service['submit']).not.toHaveBeenCalled();
    expect(el().textContent).toContain('Please upload proof for this achievement.');
  });

  it('keeps the proof on file when editing without choosing a new one', async () => {
    await render([
      {
        achievement: achievement({ id: 'mvp', name: 'Microsoft MVP' }),
        mine: mine({ achievementId: 'mvp', proofFileName: 'mvp.pdf' }),
        progress: [],
      },
    ]);

    button('Edit').click();
    fixture.detectChanges();
    expect(el().textContent).toContain('sends this badge back for review');
    button('Submit').click();
    await new Promise((r) => setTimeout(r));

    expect(service['submit']).toHaveBeenCalledWith('mvp', expect.objectContaining({ keepProof: true, proof: null }));
  });
});
