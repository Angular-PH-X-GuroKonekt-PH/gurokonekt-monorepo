import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { SignInMethodsController } from './sign-in-methods.controller';
import { SignInMethodsService } from './sign-in-methods.service';

@Module({
  imports: [PrismaModule, SupabaseModule, JwtGuardModule, PassportModule],
  controllers: [SignInMethodsController],
  providers: [SignInMethodsService],
})
export class SignInMethodsModule {}
