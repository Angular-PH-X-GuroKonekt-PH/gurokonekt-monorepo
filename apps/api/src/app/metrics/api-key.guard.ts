import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'];
    const expectedKey = process.env.METRICS_API_KEY;

    if (!expectedKey) {
      this.logger.error('METRICS_API_KEY environment variable is not set');
      throw new UnauthorizedException('Metrics endpoint is not configured');
    }

    if (!providedKey || providedKey !== expectedKey) {
      this.logger.warn(
        `Metrics endpoint access denied — invalid or missing X-API-Key header`,
      );
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
