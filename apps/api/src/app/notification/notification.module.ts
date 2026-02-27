import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NotificationGateway } from '../gateway/notification-gateway.gateway';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [PrismaModule, JwtGuardModule, PassportModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
