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
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';

@Module({
  imports: [PrismaModule, SupabaseModule, AuthModule, JwtGuardModule],
  controllers: [
    AdminController,
    AdminBookingController,
    AdminDashboardController,
    AdminAnnouncementsController,
    AdminReportsController,
    AdminRolesController,
  ],
  providers: [
    AdminService,
    AdminBookingService,
    AdminDashboardService,
    AdminAnnouncementsService,
    AdminReportsService,
    AdminRolesService,
  ],
})
export class AdminModule {}
