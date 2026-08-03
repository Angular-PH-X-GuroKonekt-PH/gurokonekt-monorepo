import { Injectable, Logger } from '@nestjs/common';

export const RECAPTCHA_VERIFY_URL =
  'https://www.google.com/recaptcha/api/siteverify';

/**
 * Minimum score a reCAPTCHA v3 submission must reach to be accepted.
 *
 * Google returns 0.0 (almost certainly a bot) to 1.0 (almost certainly human).
 * 0.5 is Google's own suggested starting point. Expect to tune this once real
 * traffic arrives — that is why it lives here rather than inline.
 */
export const RECAPTCHA_MIN_SCORE = 0.5;

/** Bounds the outbound call so a hanging Google request cannot pin a worker. */
export const RECAPTCHA_TIMEOUT_MS = 10_000;

export enum RecaptchaFailureReason {
  /** Google said the token is invalid, expired, or already used. */
  Rejected = 'rejected',
  /** Token was valid but scored too low to trust. */
  LowScore = 'low_score',
  /** Google could not be reached, timed out, or errored. */
  Unavailable = 'unavailable',
  /** No secret key on this server. */
  NotConfigured = 'not_configured',
}

export type RecaptchaResult =
  | { ok: true }
  | { ok: false; reason: RecaptchaFailureReason };

interface SiteVerifyResponse {
  success?: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);

  /**
   * Verifies a reCAPTCHA v3 token with Google.
   *
   * Returns a reason rather than a bare boolean so the caller can map each
   * failure to the right HTTP status — a bot (400) and an outage (502) are very
   * different things to the person filling in the form.
   *
   * Fails **closed**: anything other than an explicit pass is a rejection. In
   * particular a network failure is not treated as success, because failing open
   * would let an attacker bypass verification simply by making Google
   * unreachable.
   */
  async verify(token: string): Promise<RecaptchaResult> {
    const secret = process.env['RECAPTCHA_SECRET_KEY'];

    if (!secret) {
      // Local development would otherwise be blocked until keys are handed out.
      if (process.env['NODE_ENV'] === 'development') {
        this.logger.warn(
          'RECAPTCHA_SECRET_KEY is not set — skipping verification because NODE_ENV=development. Submissions are UNPROTECTED.',
        );
        return { ok: true };
      }

      this.logger.error(
        'RECAPTCHA_SECRET_KEY is not set — rejecting all submissions. Set it to accept inquiries.',
      );
      return { ok: false, reason: RecaptchaFailureReason.NotConfigured };
    }

    let body: SiteVerifyResponse;

    try {
      const response = await fetch(RECAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(RECAPTCHA_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.error(
          `reCAPTCHA verification returned HTTP ${response.status}`,
        );
        return { ok: false, reason: RecaptchaFailureReason.Unavailable };
      }

      body = (await response.json()) as SiteVerifyResponse;
    } catch (error: any) {
      this.logger.error(
        `reCAPTCHA verification could not reach Google: ${error?.message}`,
      );
      return { ok: false, reason: RecaptchaFailureReason.Unavailable };
    }

    if (!body.success) {
      this.logger.warn(
        `reCAPTCHA rejected a token: ${(body['error-codes'] ?? []).join(', ') || 'no error code'}`,
      );
      return { ok: false, reason: RecaptchaFailureReason.Rejected };
    }

    const score = body.score ?? 0;
    if (score < RECAPTCHA_MIN_SCORE) {
      this.logger.warn(
        `reCAPTCHA score ${score} is below the ${RECAPTCHA_MIN_SCORE} threshold`,
      );
      return { ok: false, reason: RecaptchaFailureReason.LowScore };
    }

    return { ok: true };
  }
}
