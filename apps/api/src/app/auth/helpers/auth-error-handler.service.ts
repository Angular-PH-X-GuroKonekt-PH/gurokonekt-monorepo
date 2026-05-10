import { Injectable, Logger } from '@nestjs/common';
import { AuthResponseFactory } from './auth-response.factory';
import { ResponseDto } from '@gurokonekt/models';

/**
 * Centralized error handling for auth operations
 */
@Injectable()
export class AuthErrorHandlerService {
  private readonly logger = new Logger(AuthErrorHandlerService.name);

  handleSupabaseError(error: any): ResponseDto {
    this.logger.error('Supabase error:', error?.message, error?.stack);
    return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR', error);
  }

  handleDatabaseError(error: any): ResponseDto {
    if (error?.code === 'P2002') {
      return AuthResponseFactory.errorByKey('USER_ALREADY_EXISTS');
    }
    this.logger.error('Database error:', error?.message, error?.stack);
    return AuthResponseFactory.errorByKey('INTERNAL_SERVER_ERROR', error);
  }

  handleUnexpectedError(error: any, fallbackErrorKey: string = 'INTERNAL_SERVER_ERROR'): ResponseDto {
    this.logger.error('Unexpected error:', error?.message, error?.stack);
    return AuthResponseFactory.errorByKey(fallbackErrorKey as any, error);
  }
}
