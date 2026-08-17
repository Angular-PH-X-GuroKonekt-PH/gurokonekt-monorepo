import { Injectable } from '@nestjs/common';
import { AuthLoggingService } from './auth-logging.service';
import { LogsActionType, API_RESPONSE } from '@gurokonekt/models';
import { AuthResponseFactory } from './auth-response.factory';
import { ResponseDto } from '@gurokonekt/models';

export interface RateLimitConfig {
  actionType: LogsActionType;
  maxAttempts: number;
  timeWindowMs: number; // e.g., 86400000 for 24 hours
  errorKey: keyof typeof import('@gurokonekt/models').API_RESPONSE.ERROR;
}

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

/** Renders a remaining lockout as user-facing minutes or hours, rounded up. */
function formatDuration(remainingMs: number): string {
  const minutes = Math.ceil(remainingMs / MS_PER_MINUTE);
  if (minutes < 60) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }

  const hours = Math.ceil(remainingMs / MS_PER_HOUR);
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

/** A lockout step: reaching `attempts` failures locks the account for `lockoutMs`. */
export interface LockoutTier {
  attempts: number;
  lockoutMs: number;
}

export interface TieredRateLimitConfig {
  actionType: LogsActionType;
  /** Ascending by `attempts`; the highest tier reached wins. */
  tiers: LockoutTier[];
  /** How far back failures are counted. */
  countWindowMs: number;
  errorKey: keyof typeof import('@gurokonekt/models').API_RESPONSE.ERROR;
  /** Supports the {duration} placeholder, e.g. 'Try again in {duration}.' */
  lockoutMessageTemplate: string;
  /** Log actions that clear the counter, e.g. a completed password reset. */
  resetActionTypes?: LogsActionType[];
}

/**
 * Reusable rate limiting logic for auth operations
 */
@Injectable()
export class AuthRateLimiterService {
  constructor(private readonly loggingService: AuthLoggingService) {}

  /**
   * Progressive lockout: the more failures on record, the longer the wait.
   * The clock runs from the most recent failure, so an attacker who keeps
   * hammering keeps extending their own lockout while a user who stops
   * trying is released on schedule. A successful sign-in or a completed
   * password reset (see `resetActionTypes`) wipes the counter, which is the
   * self-service way back in for a locked-out account.
   */
  async checkTieredRateLimit(
    config: TieredRateLimitConfig,
    identifier: string,
    metadataKey = 'email'
  ): Promise<ResponseDto | null> {
    const windowStart = new Date(Date.now() - config.countWindowMs);
    const resetPoint = config.resetActionTypes?.length
      ? await this.loggingService.getLockoutResetPoint(
          config.resetActionTypes,
          identifier,
          metadataKey,
          windowStart
        )
      : null;

    const since = resetPoint && resetPoint > windowStart ? resetPoint : windowStart;

    const { count, lastFailureAt } = await this.loggingService.getFailedAttemptStats(
      config.actionType,
      identifier,
      metadataKey,
      since
    );

    const tier = [...config.tiers]
      .sort((a, b) => a.attempts - b.attempts)
      .reduce<LockoutTier | null>(
        (reached, candidate) => (count >= candidate.attempts ? candidate : reached),
        null
      );

    if (!tier || !lastFailureAt) {
      return null;
    }

    const remainingMs = lastFailureAt.getTime() + tier.lockoutMs - Date.now();
    if (remainingMs <= 0) {
      return null;
    }

    return AuthResponseFactory.error(
      API_RESPONSE.ERROR[config.errorKey].code,
      config.lockoutMessageTemplate.replace('{duration}', formatDuration(remainingMs))
    );
  }

  async checkRateLimit(
    config: RateLimitConfig,
    identifier: string,
    metadataKey = 'email'
  ): Promise<ResponseDto | null> {
    const count = await this.loggingService.getFailedAttemptCount(
      config.actionType,
      identifier,
      metadataKey,
      config.timeWindowMs
    );

    if (count < config.maxAttempts) {
      return null;
    }

    return AuthResponseFactory.errorByKey(config.errorKey);
  }

  async checkTimeSinceLastAttempt(
    actionType: LogsActionType,
    identifier: string,
    minIntervalMs: number,
    metadataKey = 'email'
  ): Promise<{ allowed: boolean; secondsRemaining?: number }> {
    const lastAttempt = await this.loggingService.getLastAttempt(
      actionType,
      identifier,
      metadataKey
    );

    if (!lastAttempt) return { allowed: true };

    const secondsSinceLast = (Date.now() - lastAttempt.createdAt.getTime()) / 1000;
    const allowed = secondsSinceLast >= minIntervalMs / 1000;

    return {
      allowed,
      secondsRemaining: allowed ? undefined : Math.ceil(minIntervalMs / 1000 - secondsSinceLast),
    };
  }
}
