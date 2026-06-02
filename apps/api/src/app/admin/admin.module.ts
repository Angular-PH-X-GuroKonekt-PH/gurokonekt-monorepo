import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';

@Module({
  imports: [PrismaModule, SupabaseModule, AuthModule, JwtGuardModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
