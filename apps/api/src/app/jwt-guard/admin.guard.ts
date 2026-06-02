import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { API_RESPONSE, UserRole } from '@gurokonekt/models';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== UserRole.Admin) {
      throw new ForbiddenException(API_RESPONSE.ERROR.ADMIN_ACCESS_DENIED.message);
    }

    return true;
  }
}
