import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { MailModule } from '../mail/mail.module';
import { JwtGuardModule } from '../jwt-guard/jwt-guard.module';
import { AchievementsController } from './achievements.controller';
import { AdminAchievementsController } from './admin-achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementMetricsService } from './achievement-metrics.service';
import { AchievementSchedulerService } from './achievement-scheduler.service';

@Module({
  imports: [PrismaModule, StorageModule, MailModule, JwtGuardModule],
  controllers: [AchievementsController, AdminAchievementsController],
  providers: [AchievementsService, AchievementMetricsService, AchievementSchedulerService],
})
export class AchievementsModule {}
