import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBookingController } from './admin-booking.controller';
import { AdminBookingService } from './admin-booking.service';
import { AdminMentorController } from './admin-mentor.controller';
import { AdminMentorService } from './admin-mentor.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, SupabaseModule, AuthModule, JwtGuardModule, MailModule],
  controllers: [AdminController, AdminBookingController, AdminMentorController],
  providers: [AdminService, AdminBookingService, AdminMentorService],
})
export class AdminModule {}
