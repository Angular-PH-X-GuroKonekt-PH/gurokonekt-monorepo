import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationGateway } from './notification-gateway.gateway';

@Module({
  imports: [PrismaModule, SupabaseModule],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationGatewayModule {}
