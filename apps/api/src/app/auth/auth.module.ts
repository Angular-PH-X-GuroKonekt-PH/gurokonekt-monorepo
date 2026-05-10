import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { StorageModule } from '../storage/storage.module';
import {
  AuthValidationService,
  AuthLoggingService,
  AuthRateLimiterService,
  AuthErrorHandlerService,
} from './helpers';

@Module({
  imports: [PrismaModule, StorageModule, SupabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthValidationService,
    AuthLoggingService,
    AuthRateLimiterService,
    AuthErrorHandlerService,
  ],
})
export class AuthModule {}
