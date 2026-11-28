import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NotificationGatewayModule } from '../gateway/notification-gateway.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BadgesModule } from '../badges/badges.module';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [
    PrismaModule,
    BadgesModule,
    JwtGuardModule,
    PassportModule,
    NotificationGatewayModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
