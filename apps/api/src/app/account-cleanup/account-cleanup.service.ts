import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { LogsActionType, UserStatus } from '@gurokonekt/models';
import { PrismaService } from '../prisma/prisma.service';

/** Self-deactivated accounts are marked deleted after this many days inactive. */
export const ACCOUNT_DELETION_AFTER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
// Give the app a moment to finish booting before the first sweep.
const FIRST_RUN_DELAY_MS = 60 * 1000;

/**
 * Marks self-deactivated accounts as `deleted` once they have been inactive for
 * ACCOUNT_DELETION_AFTER_DAYS. This is a soft delete: the row and its history
 * stay, the user just can no longer sign in (the JWT guard rejects `deleted`).
 *
 * Only accounts with `deactivatedAt` set are considered, which is the email-link
 * self-deactivation flow; accounts an admin set to inactive are left alone. A
 * mentor with a pending reactivation request is skipped so an unreviewed request
 * never costs them their account.
 *
 * Runs in-process on a timer (no scheduler dependency). Every step is
 * idempotent, so a second API instance sweeping at the same time is harmless.
 */
@Injectable()
export class AccountCleanupService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(AccountCleanupService.name);
  private firstRun?: NodeJS.Timeout;
  private interval?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap(): void {
    this.firstRun = setTimeout(() => void this.deleteExpiredDeactivatedAccounts(), FIRST_RUN_DELAY_MS);
    this.interval = setInterval(() => void this.deleteExpiredDeactivatedAccounts(), DAY_MS);
    // Never keep the process alive just for this timer.
    this.firstRun.unref();
    this.interval.unref();
  }

  onModuleDestroy(): void {
    clearTimeout(this.firstRun);
    clearInterval(this.interval);
  }

  /** Returns how many accounts were marked deleted. Never throws. */
  async deleteExpiredDeactivatedAccounts(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - ACCOUNT_DELETION_AFTER_DAYS * DAY_MS);
    const expiredWhere = {
      status: UserStatus.Inactive,
      deactivatedAt: { not: null, lte: cutoff },
      NOT: { activationRequest: { is: { status: 'pending' as const } } },
    };

    try {
      const expired = await this.prisma.db.user.findMany({
        where: expiredWhere,
        select: { id: true, role: true, deactivatedAt: true },
      });

      let deleted = 0;
      for (const user of expired) {
        // Re-check the conditions in the update itself, so a user who
        // reactivated (or asked to) since the read above is not deleted.
        const { count } = await this.prisma.db.user.updateMany({
          where: { id: user.id, ...expiredWhere },
          data: { status: UserStatus.Deleted },
        });
        if (!count) continue;

        deleted++;
        await this.prisma.db.logs.create({
          data: {
            actionType: LogsActionType.AccountAutoDeleted,
            targetId: user.id,
            details: `Account marked deleted after ${ACCOUNT_DELETION_AFTER_DAYS} days inactive`,
            metadata: { role: user.role, deactivatedAt: user.deactivatedAt?.toISOString() ?? null },
            ipAddress: 'system',
            userAgent: 'account-cleanup',
          },
        });
      }

      if (deleted) {
        this.logger.log(`Marked ${deleted} inactive account(s) as deleted`);
      }
      return deleted;
    } catch (error: any) {
      this.logger.error(`Account cleanup failed: ${error?.message}`, error?.stack);
      return 0;
    }
  }
}
