import { Module } from '@nestjs/common';
import { JwtGuardStrategy } from './jwt-guard.strategy';

@Module({
  providers: [JwtGuardStrategy],
  exports: [JwtGuardStrategy],
})
export class JwtGuardModule {}