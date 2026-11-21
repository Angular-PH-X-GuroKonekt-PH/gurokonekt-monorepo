import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountCleanupService } from './account-cleanup.service';

@Module({
  imports: [PrismaModule],
  providers: [AccountCleanupService],
})
export class AccountCleanupModule {}
