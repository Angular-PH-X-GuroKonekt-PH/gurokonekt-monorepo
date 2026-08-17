import { Test, TestingModule } from '@nestjs/testing';
import { LogsActionType, ResponseStatus } from '@gurokonekt/models';
import { AuthLoggingService } from './auth-logging.service';
import { AuthRateLimiterService, TieredRateLimitConfig } from './auth-rate-limiter.service';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const EMAIL = 'admin@gurokonekt.com';

const CONFIG: TieredRateLimitConfig = {
  actionType: LogsActionType.SignIn,
  countWindowMs: DAY,
  tiers: [
    { attempts: 5, lockoutMs: 15 * MINUTE },
    { attempts: 10, lockoutMs: HOUR },
    { attempts: 15, lockoutMs: DAY },
  ],
  errorKey: 'SIGNIN_ATTEMPT_TOO_MANY_ATTEMPTS',
  lockoutMessageTemplate: 'Too many failed login attempts. Try again in {duration}.',
  resetActionTypes: [LogsActionType.VerifyResetPin],
};

describe('AuthRateLimiterService', () => {
  let service: AuthRateLimiterService;
  let logging: {
    getFailedAttemptStats: jest.Mock;
    getLockoutResetPoint: jest.Mock;
  };

  const NOW = new Date('2026-08-18T12:00:00.000Z').getTime();

  /** Configure the log store: `count` failures, the most recent `agoMs` ago. */
  const withFailures = (count: number, agoMs = 0) => {
    logging.getFailedAttemptStats.mockResolvedValue({
      count,
      lastFailureAt: count > 0 ? new Date(NOW - agoMs) : null,
    });
  };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);

    logging = {
      getFailedAttemptStats: jest.fn().mockResolvedValue({ count: 0, lastFailureAt: null }),
      getLockoutResetPoint: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRateLimiterService,
        { provide: AuthLoggingService, useValue: logging },
      ],
    }).compile();

    service = module.get(AuthRateLimiterService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('below the first tier', () => {
    it('allows sign-in with no failures on record', async () => {
      withFailures(0);
      expect(await service.checkTieredRateLimit(CONFIG, EMAIL)).toBeNull();
    });

    it('allows sign-in on the attempt before the first tier trips', async () => {
      withFailures(4);
      expect(await service.checkTieredRateLimit(CONFIG, EMAIL)).toBeNull();
    });
  });

  describe('tier boundaries', () => {
    it('locks out for 15 minutes at the 5th failure', async () => {
      withFailures(5);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result).toMatchObject({
        status: ResponseStatus.Error,
        statusCode: 429,
        message: 'Too many failed login attempts. Try again in 15 minutes.',
      });
    });

    it('escalates to 1 hour at the 10th failure', async () => {
      withFailures(10);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result?.message).toBe('Too many failed login attempts. Try again in 1 hour.');
    });

    it('escalates to 24 hours at the 15th failure', async () => {
      withFailures(15);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result?.message).toBe('Too many failed login attempts. Try again in 24 hours.');
    });

    it('stays on the 15-minute tier at 9 failures', async () => {
      withFailures(9);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result?.message).toBe('Too many failed login attempts. Try again in 15 minutes.');
    });

    it('stays on the 1-hour tier at 14 failures', async () => {
      withFailures(14);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result?.message).toBe('Too many failed login attempts. Try again in 1 hour.');
    });

    it('holds the top tier beyond the last threshold', async () => {
      withFailures(50);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result?.message).toBe('Too many failed login attempts. Try again in 24 hours.');
    });
  });

  describe('lockout release', () => {
    it('counts the lockout from the most recent failure, not the first', async () => {
      withFailures(5, 5 * MINUTE);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result?.message).toBe('Too many failed login attempts. Try again in 10 minutes.');
    });

    it('allows sign-in once the lockout has elapsed', async () => {
      withFailures(5, 15 * MINUTE);

      expect(await service.checkTieredRateLimit(CONFIG, EMAIL)).toBeNull();
    });

    it('reports whole minutes remaining, rounded up', async () => {
      withFailures(5, 14 * MINUTE + 30 * 1000);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result?.message).toBe('Too many failed login attempts. Try again in 1 minute.');
    });

    it('reports hours once more than an hour remains', async () => {
      withFailures(15, 30 * MINUTE);

      const result = await service.checkTieredRateLimit(CONFIG, EMAIL);

      expect(result?.message).toBe('Too many failed login attempts. Try again in 24 hours.');
    });
  });

  describe('counting window', () => {
    it('only counts failures newer than the reset point', async () => {
      const resetAt = new Date(NOW - 2 * HOUR);
      logging.getLockoutResetPoint.mockResolvedValue(resetAt);
      withFailures(5);

      await service.checkTieredRateLimit(CONFIG, EMAIL);

      const since = logging.getFailedAttemptStats.mock.calls[0][3] as Date;
      expect(since.getTime()).toBe(resetAt.getTime());
    });

    it('falls back to the counting window when there is no reset point', async () => {
      withFailures(5);

      await service.checkTieredRateLimit(CONFIG, EMAIL);

      const since = logging.getFailedAttemptStats.mock.calls[0][3] as Date;
      expect(since.getTime()).toBe(NOW - DAY);
    });

    it('ignores a reset point older than the counting window', async () => {
      logging.getLockoutResetPoint.mockResolvedValue(new Date(NOW - 3 * DAY));
      withFailures(5);

      await service.checkTieredRateLimit(CONFIG, EMAIL);

      const since = logging.getFailedAttemptStats.mock.calls[0][3] as Date;
      expect(since.getTime()).toBe(NOW - DAY);
    });
  });
});
