import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { BookingModule } from './booking/booking.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    SupabaseModule,
    UserModule,
    NotificationModule,
    BookingModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
