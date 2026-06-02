import { Module } from '@nestjs/common';
import { AdminBookingController } from './admin-booking.controller';
import { AdminBookingService } from './admin-booking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';

@Module({
  imports: [PrismaModule, JwtGuardModule],
  controllers: [AdminBookingController],
  providers: [AdminBookingService],
})
export class AdminModule {}
