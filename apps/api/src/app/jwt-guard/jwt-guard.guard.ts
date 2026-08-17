import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * An expired token and a token the API cannot verify are both 401s, but they
 * mean very different things to the client: the first is a real session expiry
 * that a refresh can fix, the second is a rejected token. The client can only
 * tell them apart if the API says which one it is, so the reason is surfaced as
 * an errorCode rather than left as a bare "Unauthorized".
 */
const SESSION_EXPIRED = 'SESSION_EXPIRED';
const INVALID_TOKEN = 'INVALID_TOKEN';

@Injectable()
export class JwtGuardGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtGuardGuard.name);

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      const reason = info?.message ?? info ?? err?.message ?? 'unknown reason';
      this.logger.error(`JWT rejected — ${reason}`);

      if (err) {
        throw err;
      }

      const expired = info?.name === 'TokenExpiredError';
      throw new UnauthorizedException({
        statusCode: 401,
        message: expired
          ? 'Your session has expired. Please log in again.'
          : 'Your session could not be verified. Please log in again.',
        errorCode: expired ? SESSION_EXPIRED : INVALID_TOKEN,
      });
    }
    return user;
  }
}
