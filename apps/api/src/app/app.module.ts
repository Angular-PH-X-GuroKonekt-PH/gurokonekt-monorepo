import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { MenteeModule } from './user/mentee/mentee.module';
import { MentorModule } from './user/mentor/mentor.module';
import { AdminModule } from './user/admin/admin.module';
import { StorageModule } from './storage/storage.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    AuthModule,
    MenteeModule,
    MentorModule,
    AdminModule,
    StorageModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
