import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NotificationGateway } from '../gateway/notification-gateway.gateway';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [PrismaModule, JwtGuardModule, PassportModule],
  controllers: [ReviewController],
  providers: [ReviewService, NotificationGateway],
})
export class ReviewModule {}
