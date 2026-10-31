import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AchievementAwardType, AchievementMetric } from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { AchievementFormModalComponent } from './achievement-form-modal';

describe('AchievementFormModalComponent', () => {
  let fixture: ComponentFixture<AchievementFormModalComponent>;
  let saved: ReturnType<typeof vi.fn>;

  const el = () => fixture.nativeElement as HTMLElement;
  const type = (selector: string, value: string) => {
    const input = el().querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const button = (label: string) =>
    Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim() === label) as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AchievementFormModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(AchievementFormModalComponent);
    saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('requires a name and description', () => {
    button('Create achievement').click();
    fixture.detectChanges();

    expect(saved).not.toHaveBeenCalled();
    expect(el().textContent).toContain('Name and description are required.');
  });

  it('sends application settings for an application achievement', () => {
    type('#ach-name', 'Microsoft MVP');
    type('#ach-desc', 'Recognised by Microsoft');
    type('#ach-req', 'Upload your MVP certificate');

    button('Create achievement').click();

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Microsoft MVP',
        awardType: AchievementAwardType.Application,
        requirements: 'Upload your MVP certificate',
        requiresProof: true,
        autoApprove: false,
        validityMonths: null,
      }),
    );
    expect(saved.mock.calls[0][0]).not.toHaveProperty('criteria');
  });

  it('sends rules (and no application settings) for an automatic achievement', () => {
    type('#ach-name', '50 Sessions');
    type('#ach-desc', 'Completed 50 sessions');
    const automatic = el().querySelectorAll('input[name="awardType"]')[1] as HTMLInputElement;
    automatic.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    button('Create achievement').click();

    const payload = saved.mock.calls[0][0];
    expect(payload.awardType).toBe(AchievementAwardType.Automatic);
    expect(payload.criteria).toEqual([{ metric: AchievementMetric.CompletedSessions, min: 10 }]);
    expect(payload).not.toHaveProperty('requiresProof');
  });
});
