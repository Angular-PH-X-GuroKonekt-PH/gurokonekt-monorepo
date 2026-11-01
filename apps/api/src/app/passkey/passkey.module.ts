import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { PasskeyController } from './passkey.controller';
import { PasskeyLoginController } from './passkey-login.controller';
import { PasskeyLoginService } from './passkey-login.service';
import { PasskeyService } from './passkey.service';

@Module({
  imports: [PrismaModule, SupabaseModule, JwtGuardModule, PassportModule],
  controllers: [PasskeyLoginController, PasskeyController],
  providers: [PasskeyService, PasskeyLoginService],
})
export class PasskeyModule {}
