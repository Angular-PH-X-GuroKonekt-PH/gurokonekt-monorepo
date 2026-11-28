import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminAuthenticationSettingsController, AuthRequirementsController } from './auth-requirements.controller';
import { AuthRequirementsService } from './auth-requirements.service';

/** Global because JwtGuardGuard needs the service in every module that uses it. */
@Global()
@Module({
  imports: [PrismaModule, SupabaseModule, JwtGuardModule, PassportModule],
  controllers: [AuthRequirementsController, AdminAuthenticationSettingsController],
  providers: [AuthRequirementsService],
  exports: [AuthRequirementsService],
})
export class AuthRequirementsModule {}
