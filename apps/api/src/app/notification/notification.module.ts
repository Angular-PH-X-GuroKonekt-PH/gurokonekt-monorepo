import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NotificationGatewayModule } from '../gateway/notification-gateway.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    PrismaModule,
    JwtGuardModule,
    PassportModule,
    NotificationGatewayModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
