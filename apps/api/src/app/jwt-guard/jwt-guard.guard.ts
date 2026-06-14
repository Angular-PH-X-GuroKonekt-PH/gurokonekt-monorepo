import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { API_RESPONSE } from '@gurokonekt/models';

@Injectable()
export class JwtGuardGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtGuardGuard.name);

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      this.logger.error(`JWT rejected — ${info?.message ?? err?.message ?? 'unknown reason'}`);

      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          statusCode: API_RESPONSE.ERROR.SESSION_EXPIRED.code,
          message: API_RESPONSE.ERROR.SESSION_EXPIRED.message,
          errorCode: 'SESSION_EXPIRED',
        });
      }

      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}