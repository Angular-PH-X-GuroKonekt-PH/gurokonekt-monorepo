import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicMentorController } from './public-mentor.controller';
import { PublicMentorService } from './public-mentor.service';

/**
 * Unauthenticated endpoints for the public marketing site.
 *
 * Kept separate from `SearchModule` so the absence of guards is explicit rather
 * than an exception hidden among guarded routes.
 */
@Module({
  imports: [PrismaModule],
  controllers: [PublicMentorController],
  providers: [PublicMentorService],
})
export class PublicModule {}
