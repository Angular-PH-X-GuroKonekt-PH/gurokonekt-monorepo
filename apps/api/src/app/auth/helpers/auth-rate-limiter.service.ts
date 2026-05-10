import { Injectable } from '@nestjs/common';
import { AuthLoggingService } from './auth-logging.service';
import { LogsActionType } from '@gurokonekt/models';
import { AuthResponseFactory } from './auth-response.factory';
import { ResponseDto } from '@gurokonekt/models';

export interface RateLimitConfig {
  actionType: LogsActionType;
  maxAttempts: number;
  timeWindowMs: number; // e.g., 86400000 for 24 hours
  errorKey: keyof typeof import('@gurokonekt/models').API_RESPONSE.ERROR;
}

/**
 * Reusable rate limiting logic for auth operations
 */
@Injectable()
export class AuthRateLimiterService {
  constructor(private readonly loggingService: AuthLoggingService) {}

  async checkRateLimit(
    config: RateLimitConfig,
    identifier: string,
    metadataKey: string = 'email'
  ): Promise<ResponseDto | null> {
    const count = await this.loggingService.getFailedAttemptCount(
      config.actionType,
      identifier,
      metadataKey,
      config.timeWindowMs
    );

    if (count >= config.maxAttempts) {
      return AuthResponseFactory.errorByKey(config.errorKey);
    }

    return null;
  }

  async checkTimeSinceLastAttempt(
    actionType: LogsActionType,
    identifier: string,
    minIntervalMs: number,
    metadataKey: string = 'email'
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
