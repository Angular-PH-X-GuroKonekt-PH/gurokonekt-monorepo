import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

const DAY_MS = 24 * 60 * 60 * 1000;
// Give the app a moment to finish booting before the first run.
const FIRST_RUN_DELAY_MS = 90 * 1000;

/**
 * Once a day: expire badges past their date, then grant automatic achievements
 * to mentors who now qualify. In-process timer (no scheduler dependency); both
 * steps are idempotent, so a second API instance running them too is harmless.
 */
@Injectable()
export class AchievementSchedulerService implements OnApplicationBootstrap, OnModuleDestroy {
  private firstRun?: NodeJS.Timeout;
  private interval?: NodeJS.Timeout;

  constructor(private readonly achievements: AchievementsService) {}

  onApplicationBootstrap(): void {
    this.firstRun = setTimeout(() => void this.runDaily(), FIRST_RUN_DELAY_MS);
    this.interval = setInterval(() => void this.runDaily(), DAY_MS);
    this.firstRun.unref();
    this.interval.unref();
  }

  onModuleDestroy(): void {
    clearTimeout(this.firstRun);
    clearInterval(this.interval);
  }

  async runDaily(): Promise<void> {
    await this.achievements.expireBadges();
    await this.achievements.evaluateAutomatic();
  }
}
