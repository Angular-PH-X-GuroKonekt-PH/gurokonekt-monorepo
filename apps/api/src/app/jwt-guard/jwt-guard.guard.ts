import { ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { API_RESPONSE, AUTH_SETUP_REQUIRED_ERROR_CODE } from '@gurokonekt/models';
import { AuthRequirementsService } from '../auth-requirements/auth-requirements.service';
import { ALLOW_INCOMPLETE_AUTH_SETUP } from '../auth-requirements/allow-incomplete-auth-setup.decorator';

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

  constructor(
    private readonly reflector: Reflector,
    private readonly authRequirements: AuthRequirementsService
  ) {
    super();
  }

  /**
   * After the token checks out, accounts missing a required sign-in method
   * (#463) are turned away from everything except the setup routes. This runs
   * on every request, so a newly required method also stops existing sessions.
   */
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await (super.canActivate(context) as Promise<boolean>);

    const setupRoute = this.reflector.getAllAndOverride<boolean>(ALLOW_INCOMPLETE_AUTH_SETUP, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (setupRoute) return true;

    const { user } = context.switchToHttp().getRequest<{ user: { id: string } }>();
    const status = await this.authRequirements.getStatus(user.id);
    if (!status.requirementsCompleted) {
      throw new ForbiddenException({
        statusCode: API_RESPONSE.ERROR.AUTH_SETUP_REQUIRED.code,
        message: API_RESPONSE.ERROR.AUTH_SETUP_REQUIRED.message,
        errorCode: AUTH_SETUP_REQUIRED_ERROR_CODE,
        missingRequirements: status.missingRequirements,
      });
    }
    return true;
  }

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
