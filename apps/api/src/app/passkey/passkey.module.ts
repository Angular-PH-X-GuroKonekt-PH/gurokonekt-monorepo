import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PasskeyController } from './passkey.controller';
import { PasskeyService } from './passkey.service';

@Module({
  imports: [PrismaModule, JwtGuardModule, PassportModule],
  controllers: [PasskeyController],
  providers: [PasskeyService],
})
export class PasskeyModule {}
