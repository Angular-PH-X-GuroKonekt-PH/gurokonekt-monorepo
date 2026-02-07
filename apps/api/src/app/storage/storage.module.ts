import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  controllers: [StorageController],
  exports: [StorageService],
  imports: [PrismaModule, SupabaseModule],
  providers: [StorageService],
})
export class StorageModule {}
