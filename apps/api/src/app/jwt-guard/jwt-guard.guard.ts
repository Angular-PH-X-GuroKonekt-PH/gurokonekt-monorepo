import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuardGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtGuardGuard.name);

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      this.logger.error(`JWT rejected — ${info?.message ?? info ?? err?.message ?? 'unknown reason'}`);
      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}