import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { EmailDeliveryModule } from '../email-delivery/email-delivery.module';
import { NotificationGatewayModule } from '../gateway/notification-gateway.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [
    PrismaModule,
    JwtGuardModule,
    PassportModule,
    NotificationGatewayModule,
    EmailDeliveryModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
