import { Module } from '@nestjs/common';
import { JwtGuardStrategy } from './jwt-guard.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JwtGuardStrategy],
  exports: [JwtGuardStrategy],
})
export class JwtGuardModule {}