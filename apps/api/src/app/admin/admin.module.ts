import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBookingController } from './admin-booking.controller';
import { AdminBookingService } from './admin-booking.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAnnouncementsController } from './admin-announcements.controller';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminRolesController } from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';
import { AdminMentorController } from './admin-mentor.controller';
import { AdminMentorService } from './admin-mentor.service';
import { AdminInquiryController } from './admin-inquiry.controller';
import { AdminInquiryService } from './admin-inquiry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { MailModule } from '../mail/mail.module';
import { NotificationGatewayModule } from '../gateway/notification-gateway.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
    AuthModule,
    JwtGuardModule,
    MailModule,
    NotificationGatewayModule,
  ],
  controllers: [
    AdminController,
    AdminBookingController,
    AdminDashboardController,
    AdminAnnouncementsController,
    AdminReportsController,
    AdminRolesController,
    AdminMentorController,
    AdminInquiryController,
  ],
  providers: [
    AdminService,
    AdminBookingService,
    AdminDashboardService,
    AdminAnnouncementsService,
    AdminReportsService,
    AdminRolesService,
    AdminMentorService,
    AdminInquiryService,
  ],
})
export class AdminModule {}
