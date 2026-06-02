import { Module } from '@nestjs/common';
import { JwtGuardStrategy } from './jwt-guard.strategy';
import { AdminGuard } from './admin.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JwtGuardStrategy, AdminGuard],
  exports: [JwtGuardStrategy, AdminGuard],
})
export class JwtGuardModule {}