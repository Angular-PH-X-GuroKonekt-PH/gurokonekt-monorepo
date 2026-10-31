import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ACHIEVEMENT_METRICS,
  ACHIEVEMENT_PROOF_MAX_BYTES,
  ACHIEVEMENT_PROOF_TYPES,
  AchievementAwardType,
  MentorAchievementCatalogItem,
  MentorAchievementStatus,
  MentorBadgeInterface,
} from '@gurokonekt/models/interfaces/achievement/achievement.model';
import { AchievementsService } from '../../achievements.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { MentorBadgesComponent } from '../../../../shared/components/mentor-badges/mentor-badges';

const LIGHT: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  blue: 'bg-blue-50 text-blue-800 border-blue-200',
  green: 'bg-green-50 text-green-800 border-green-200',
  purple: 'bg-purple-50 text-purple-800 border-purple-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};

const STATUS: Record<MentorAchievementStatus, { label: string; classes: string }> = {
  [MentorAchievementStatus.Pending]: { label: 'Waiting for review', classes: 'bg-yellow-100 text-yellow-800' },
  [MentorAchievementStatus.Approved]: { label: 'On your profile', classes: 'bg-green-100 text-green-800' },
  [MentorAchievementStatus.Rejected]: { label: 'Not approved', classes: 'bg-red-100 text-red-800' },
  [MentorAchievementStatus.Expired]: { label: 'Expired', classes: 'bg-slate-100 text-slate-600' },
  [MentorAchievementStatus.Revoked]: { label: 'Removed by admin', classes: 'bg-slate-200 text-slate-700' },
};

interface ApplicationForm {
  details: string;
  earnedAt: string;
  expiresAt: string;
  proof: File | null;
}

/** Profile Settings → Achievements (mentors only, issue #419). */
@Component({
  selector: 'app-profile-achievements-section-page',
  standalone: true,
  imports: [MentorBadgesComponent],
  templateUrl: './profile-achievements-section.page.html',
})
export class ProfileAchievementsSectionPage implements OnInit {
  private readonly service = inject(AchievementsService);
  private readonly toast = inject(ToastService);

  protected readonly Status = MentorAchievementStatus;
  protected readonly AwardType = AchievementAwardType;
  protected readonly statusInfo = STATUS;
  protected readonly acceptTypes = ACHIEVEMENT_PROOF_TYPES.join(',');

  protected items = signal<MentorAchievementCatalogItem[]>([]);
  protected loading = signal(true);
  protected loadError = signal<string | null>(null);
  /** Achievement whose form is open. */
  protected editingId = signal<string | null>(null);
  protected form = signal<ApplicationForm>({ details: '', earnedAt: '', expiresAt: '', proof: null });
  protected formError = signal<string | null>(null);
  protected saving = signal(false);

  /** Approved, unexpired badges, i.e. what mentees see. */
  protected readonly myBadges = computed<MentorBadgeInterface[]>(() =>
    this.items()
      .filter((i) => i.mine?.status === MentorAchievementStatus.Approved && !this.isPast(i.mine.expiresAt))
      .map((i) => ({
        id: i.achievement.id,
        name: i.achievement.name,
        icon: i.achievement.icon,
        color: i.achievement.color,
        description: i.achievement.description,
        awardedAt: i.mine!.awardedAt,
        expiresAt: i.mine!.expiresAt,
      })),
  );

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async load(): Promise<void> {
    try {
      const res = await firstValueFrom(this.service.getCatalog());
      this.items.set(res.data ?? []);
      this.loadError.set(null);
    } catch (error) {
      this.loadError.set(this.messageOf(error, 'Unable to load achievements.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected chipClasses(color: string): string {
    return LIGHT[color] ?? LIGHT['slate'];
  }

  protected metricLabel(metric: string): string {
    return ACHIEVEMENT_METRICS[metric as keyof typeof ACHIEVEMENT_METRICS]?.label ?? metric;
  }

  protected percent(current: number, min: number): number {
    return min > 0 ? Math.min(100, Math.round((current / min) * 100)) : 100;
  }

  protected formatDate(iso: string | null): string {
    return iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  }

  protected openForm(item: MentorAchievementCatalogItem): void {
    const mine = item.mine;
    this.form.set({
      details: mine?.details ?? '',
      earnedAt: mine?.earnedAt?.slice(0, 10) ?? '',
      // An expired or revoked date is no use for a renewal; start blank.
      expiresAt: mine && !this.isPast(mine.expiresAt) ? (mine.expiresAt?.slice(0, 10) ?? '') : '',
      proof: null,
    });
    this.formError.set(null);
    this.editingId.set(item.achievement.id);
  }

  protected closeForm(): void {
    this.editingId.set(null);
  }

  protected patchForm(change: Partial<ApplicationForm>): void {
    this.form.update((f) => ({ ...f, ...change }));
  }

  protected onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.formError.set(null);
    if (file && !ACHIEVEMENT_PROOF_TYPES.includes(file.type)) {
      this.formError.set('Please choose a PDF, PNG, JPEG or WebP file.');
      return;
    }
    if (file && file.size > ACHIEVEMENT_PROOF_MAX_BYTES) {
      this.formError.set('The file is larger than 10 MB.');
      return;
    }
    this.patchForm({ proof: file });
  }

  /** What submitting will do, so the mentor isn't surprised. */
  protected submitHint(item: MentorAchievementCatalogItem): string {
    if (item.achievement.autoApprove) return 'Your badge will show right away.';
    if (item.mine?.status === MentorAchievementStatus.Approved) {
      return 'Saving changes sends this badge back for review. It stays hidden until an admin approves it again.';
    }
    return 'An admin will review your application.';
  }

  protected async submit(item: MentorAchievementCatalogItem): Promise<void> {
    const f = this.form();
    const hasProofOnFile = !!item.mine?.proofFileName;
    if (item.achievement.requiresProof && !f.proof && !hasProofOnFile) {
      this.formError.set('Please upload proof for this achievement.');
      return;
    }
    if (f.earnedAt && f.expiresAt && f.expiresAt <= f.earnedAt) {
      this.formError.set('The "valid until" date must be after the date you earned it.');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    try {
      const res = await firstValueFrom(
        this.service.submit(item.achievement.id, {
          details: f.details.trim() || undefined,
          earnedAt: f.earnedAt || undefined,
          expiresAt: f.expiresAt || undefined,
          proof: f.proof,
          keepProof: !f.proof && hasProofOnFile,
        }),
      );
      this.toast.success(res.message, item.achievement.name);
      this.editingId.set(null);
      await this.load();
    } catch (error) {
      this.formError.set(this.messageOf(error, 'Unable to submit your application.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async withdraw(item: MentorAchievementCatalogItem): Promise<void> {
    try {
      await firstValueFrom(this.service.withdraw(item.achievement.id));
      this.toast.success('Removed.', item.achievement.name);
      await this.load();
    } catch (error) {
      this.toast.error(this.messageOf(error, 'Unable to remove it.'), item.achievement.name);
    }
  }

  private isPast(iso: string | null): boolean {
    return !!iso && new Date(iso).getTime() <= Date.now();
  }

  private messageOf(error: unknown, fallback: string): string {
    const message = (error as { message?: unknown })?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
